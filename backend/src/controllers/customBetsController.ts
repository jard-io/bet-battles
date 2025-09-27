import { Request, Response } from 'express';
import { AuthRequest } from '../types';
import pool from '../utils/database';
import { generateBetOutcome } from '../utils/random';

export const createCustomBet = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { player, stat, line, pickType } = req.body as { player: string; stat: string; line: number; pickType: 'OVER' | 'UNDER' };

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!player || !stat || line === undefined || !pickType) {
      return res.status(400).json({ message: 'Player, stat, line, and pick type are required' });
    }

    if (!['OVER', 'UNDER'].includes(pickType)) {
      return res.status(400).json({ message: 'Pick type must be OVER or UNDER' });
    }

    const result = await pool.query(`
      INSERT INTO custom_bets (creator_id, player, stat, line, creator_pick_type)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [userId, player, stat, line, pickType]);

    const bet = result.rows[0];

    res.status(201).json({
      message: 'Custom bet created successfully',
      bet: {
        id: bet.id,
        creatorId: bet.creator_id,
        player: bet.player,
        stat: bet.stat,
        line: bet.line,
        status: bet.status,
        outcome: bet.outcome,
        createdAt: bet.created_at
      }
    });
  } catch (error) {
    console.error('Create custom bet error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getUserCustomBets = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Get bets created by user or bets they've participated in
    const result = await pool.query(`
      SELECT DISTINCT 
        cb.*,
        u.username as creator_username,
        CASE WHEN cb.creator_id = $1 THEN true ELSE false END as is_creator
      FROM custom_bets cb
      LEFT JOIN users u ON cb.creator_id = u.id
      LEFT JOIN custom_bet_participants cbp ON cb.id = cbp.bet_id
      WHERE cb.creator_id = $1 OR cbp.user_id = $1
      ORDER BY cb.created_at DESC
    `, [userId]);

    const bets = await Promise.all(
      result.rows.map(async (bet) => {
        // Get participants for each bet
        const participantsResult = await pool.query(`
          SELECT cbp.*, u.username 
          FROM custom_bet_participants cbp
          JOIN users u ON cbp.user_id = u.id
          WHERE cbp.bet_id = $1
        `, [bet.id]);

        return {
          id: bet.id,
          creatorId: bet.creator_id,
          creatorUsername: bet.creator_username,
          player: bet.player,
          stat: bet.stat,
          line: bet.line,
          creatorPickType: bet.creator_pick_type,
          status: bet.status,
          outcome: bet.outcome,
          isCreator: bet.is_creator,
          participants: participantsResult.rows.map(p => ({
            id: p.id,
            userId: p.user_id,
            username: p.username,
            pickType: p.pick_type,
            outcome: p.outcome,
            joinedAt: p.joined_at
          })),
          createdAt: bet.created_at,
          updatedAt: bet.updated_at
        };
      })
    );

    res.json({ bets });
  } catch (error) {
    console.error('Get user custom bets error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const joinCustomBet = async (req: AuthRequest, res: Response) => {
  try {
    const { betId } = req.params as { betId: string };
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Check if bet exists and is pending
    const betResult = await pool.query(
      'SELECT * FROM custom_bets WHERE id = $1',
      [betId]
    );

    if (betResult.rows.length === 0) {
      return res.status(404).json({ message: 'Bet not found' });
    }

    const bet = betResult.rows[0];

    if (bet.status !== 'PENDING') {
      return res.status(400).json({ message: 'Bet is no longer available to join' });
    }

    if (bet.creator_id === userId) {
      return res.status(400).json({ message: 'Cannot join your own bet' });
    }

    // Check if user already joined
    const existingParticipant = await pool.query(
      'SELECT id FROM custom_bet_participants WHERE bet_id = $1 AND user_id = $2',
      [betId, userId]
    );

    if (existingParticipant.rows.length > 0) {
      return res.status(400).json({ message: 'You have already joined this bet' });
    }

    // Automatically assign opposite pick type
    const oppositePickType = bet.creator_pick_type === 'OVER' ? 'UNDER' : 'OVER';

    // Add both the creator and the participant to the participants table
    // First, add the creator if not already added
    const existingCreatorParticipant = await pool.query(
      'SELECT id FROM custom_bet_participants WHERE bet_id = $1 AND user_id = $2',
      [betId, bet.creator_id]
    );

    if (existingCreatorParticipant.rows.length === 0) {
      await pool.query(`
        INSERT INTO custom_bet_participants (bet_id, user_id, pick_type)
        VALUES ($1, $2, $3)
      `, [betId, bet.creator_id, bet.creator_pick_type]);
    }

    // Add participant with opposite pick
    await pool.query(`
      INSERT INTO custom_bet_participants (bet_id, user_id, pick_type)
      VALUES ($1, $2, $3)
    `, [betId, userId, oppositePickType]);

    // Update bet status to accepted
    await pool.query(
      'UPDATE custom_bets SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['ACCEPTED', betId]
    );

    // Automatically resolve the bet immediately after acceptance
    const outcome = generateBetOutcome();
    
    // Update bet with outcome
    let finalStatus = 'COMPLETED';
    if (outcome === 'TBD') {
      finalStatus = 'ACCEPTED'; // Keep as accepted if TBD
    }

    await pool.query(`
      UPDATE custom_bets 
      SET status = $1, outcome = $2, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $3
    `, [finalStatus, outcome, betId]);

    // Get all participants for this bet
    const participantsResult = await pool.query(
      'SELECT * FROM custom_bet_participants WHERE bet_id = $1',
      [betId]
    );

    // Update participant outcomes
    if (outcome === 'TBD') {
      // If TBD, all participants get TBD (no stats update)
      await pool.query(
        'UPDATE custom_bet_participants SET outcome = $1 WHERE bet_id = $2',
        ['TBD', betId]
      );
    } else {
      // Update each participant's outcome based on their pick vs bet outcome
      for (const participant of participantsResult.rows) {
        let participantOutcome: 'WIN' | 'LOSS';
        if (outcome === 'WIN') {
          // OVER was correct
          participantOutcome = participant.pick_type === 'OVER' ? 'WIN' : 'LOSS';
        } else {
          // UNDER was correct  
          participantOutcome = participant.pick_type === 'UNDER' ? 'WIN' : 'LOSS';
        }

        // Update participant outcome
        await pool.query(
          'UPDATE custom_bet_participants SET outcome = $1 WHERE id = $2',
          [participantOutcome, participant.id]
        );

        // Update user stats only for decided outcomes
        if (participantOutcome === 'WIN') {
          await pool.query('UPDATE users SET wins = wins + 1 WHERE id = $1', [participant.user_id]);
        } else {
          await pool.query('UPDATE users SET losses = losses + 1 WHERE id = $1', [participant.user_id]);
        }
      }
    }

    res.json({ 
      message: 'Successfully joined the bet',
      yourPick: oppositePickType,
      creatorPick: bet.creator_pick_type,
      outcome: outcome,
      yourResult: outcome === 'TBD' ? 'TBD' : (
        outcome === 'WIN' ? 
        (oppositePickType === 'OVER' ? 'WIN' : 'LOSS') :
        (oppositePickType === 'UNDER' ? 'WIN' : 'LOSS')
      )
    });
  } catch (error) {
    console.error('Join custom bet error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const declineCustomBet = async (req: AuthRequest, res: Response) => {
  try {
    const { betId } = req.params as { betId: string };
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Check if bet exists and user has permission
    const betResult = await pool.query(
      'SELECT * FROM custom_bets WHERE id = $1',
      [betId]
    );

    if (betResult.rows.length === 0) {
      return res.status(404).json({ message: 'Bet not found' });
    }

    const bet = betResult.rows[0];

    if (bet.status !== 'PENDING') {
      return res.status(400).json({ message: 'Bet is no longer pending' });
    }

    // Update bet status
    await pool.query(
      'UPDATE custom_bets SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['DECLINED', betId]
    );

    res.json({ message: 'Bet declined successfully' });
  } catch (error) {
    console.error('Decline custom bet error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Utility function to ensure creators are in participants table
export const ensureCreatorsAsParticipants = async (req: AuthRequest, res: Response) => {
  try {
    console.log('Adding missing creators to participants table...');
    
    // Get all bets that have been accepted but creator is not in participants
    const betsNeedingRetrofit = await pool.query(`
      SELECT cb.* FROM custom_bets cb
      WHERE cb.status IN ('ACCEPTED', 'COMPLETED')
      AND NOT EXISTS (
        SELECT 1 FROM custom_bet_participants cbp 
        WHERE cbp.bet_id = cb.id AND cbp.user_id = cb.creator_id
      )
    `);
    
    console.log(`Found ${betsNeedingRetrofit.rows.length} bets needing retrofit`);
    
    for (const bet of betsNeedingRetrofit.rows) {
      await pool.query(`
        INSERT INTO custom_bet_participants (bet_id, user_id, pick_type, outcome)
        VALUES ($1, $2, $3, $4)
      `, [
        bet.id, 
        bet.creator_id, 
        bet.creator_pick_type,
        bet.outcome ? (
          bet.outcome === 'TBD' ? 'TBD' : 
          bet.outcome === 'WIN' ? (bet.creator_pick_type === 'OVER' ? 'WIN' : 'LOSS') :
          bet.creator_pick_type === 'UNDER' ? 'WIN' : 'LOSS'
        ) : null
      ]);
    }
    
    res.json({ 
      message: `Retrofitted ${betsNeedingRetrofit.rows.length} bets`,
      count: betsNeedingRetrofit.rows.length 
    });
  } catch (error) {
    console.error('Retrofit error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const resolveCustomBet = async (req: AuthRequest, res: Response) => {
  try {
    const { betId } = req.params as { betId: string };
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Check if bet exists and is accepted
    const betResult = await pool.query(
      'SELECT * FROM custom_bets WHERE id = $1',
      [betId]
    );

    if (betResult.rows.length === 0) {
      return res.status(404).json({ message: 'Bet not found' });
    }

    const bet = betResult.rows[0];

    if (bet.status !== 'ACCEPTED') {
      return res.status(400).json({ message: 'Bet must be accepted to resolve' });
    }

    // Generate random outcome with 1/3 probability each
    const outcome = generateBetOutcome();

    // Update bet status based on outcome
    let newStatus = 'COMPLETED';
    if (outcome === 'TBD') {
      newStatus = 'ACCEPTED'; // Keep as accepted if TBD
    }

    await pool.query(`
      UPDATE custom_bets 
      SET status = $1, outcome = $2, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $3
    `, [newStatus, outcome, betId]);

    // Get all participants
    const participantsResult = await pool.query(
      'SELECT * FROM custom_bet_participants WHERE bet_id = $1',
      [betId]
    );

    // Update participant outcomes based on the bet result
    if (outcome === 'TBD') {
      // If TBD, all participants get TBD (no winners or losers)
      for (const participant of participantsResult.rows) {
        await pool.query(
          'UPDATE custom_bet_participants SET outcome = $1 WHERE id = $2',
          ['TBD', participant.id]
        );
        // Don't update user stats for TBD outcomes
      }
    } else {
      // For WIN/LOSS outcomes, determine individual results
      // outcome = 'WIN' means OVER was correct, 'LOSS' means UNDER was correct
      for (const participant of participantsResult.rows) {
        let participantOutcome: 'WIN' | 'LOSS';
        
        // If bet outcome is WIN (OVER was correct), OVER picks win, UNDER picks lose
        // If bet outcome is LOSS (UNDER was correct), UNDER picks win, OVER picks lose
        if (outcome === 'WIN') {
          participantOutcome = participant.pick_type === 'OVER' ? 'WIN' : 'LOSS';
        } else { // outcome === 'LOSS'
          participantOutcome = participant.pick_type === 'UNDER' ? 'WIN' : 'LOSS';
        }

        // Update participant outcome
        await pool.query(
          'UPDATE custom_bet_participants SET outcome = $1 WHERE id = $2',
          [participantOutcome, participant.id]
        );

        // Update user's record only for decided outcomes
        if (participantOutcome === 'WIN') {
          await pool.query('UPDATE users SET wins = wins + 1 WHERE id = $1', [participant.user_id]);
        } else {
          await pool.query('UPDATE users SET losses = losses + 1 WHERE id = $1', [participant.user_id]);
        }
      }
    }

    res.json({
      message: outcome === 'TBD' ? 'Bet outcome is still pending' : 'Bet resolved successfully',
      outcome,
      participantsCount: participantsResult.rows.length
    });
  } catch (error) {
    console.error('Resolve custom bet error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getCustomBetById = async (req: Request, res: Response) => {
  try {
    const { betId } = req.params as { betId: string };

    const betResult = await pool.query(`
      SELECT cb.*, u.username as creator_username
      FROM custom_bets cb
      JOIN users u ON cb.creator_id = u.id
      WHERE cb.id = $1
    `, [betId]);

    if (betResult.rows.length === 0) {
      return res.status(404).json({ message: 'Bet not found' });
    }

    const bet = betResult.rows[0];

    // Get participants
    const participantsResult = await pool.query(`
      SELECT cbp.*, u.username 
      FROM custom_bet_participants cbp
      JOIN users u ON cbp.user_id = u.id
      WHERE cbp.bet_id = $1
    `, [betId]);

    res.json({
      bet: {
        id: bet.id,
        creatorId: bet.creator_id,
        creatorUsername: bet.creator_username,
        player: bet.player,
        stat: bet.stat,
        line: bet.line,
        creatorPickType: bet.creator_pick_type,
        status: bet.status,
        outcome: bet.outcome,
        participants: participantsResult.rows.map(p => ({
          id: p.id,
          userId: p.user_id,
          username: p.username,
          pickType: p.pick_type,
          outcome: p.outcome,
          joinedAt: p.joined_at
        })),
        createdAt: bet.created_at,
        updatedAt: bet.updated_at
      }
    });
  } catch (error) {
    console.error('Get custom bet by ID error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
