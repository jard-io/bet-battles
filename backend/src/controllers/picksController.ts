import { Response } from 'express';
import { AuthRequest } from '../types';
import pool from '../utils/database';
import { simulatePickOutcome } from '../utils/random';

export const createPick = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { projectionId, pickType, playerName, statType, lineScore } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!projectionId || !pickType || !playerName || !statType || lineScore === undefined) {
      return res.status(400).json({ message: 'All pick fields are required' });
    }

    if (!['OVER', 'UNDER'].includes(pickType)) {
      return res.status(400).json({ message: 'Pick type must be OVER or UNDER' });
    }

    // Check if user already has a pick for this projection
    const existingPick = await pool.query(
      'SELECT id FROM picks WHERE user_id = $1 AND projection_id = $2',
      [userId, projectionId]
    );

    let result;
    if (existingPick.rows.length > 0) {
      // Update existing pick
      result = await pool.query(`
        UPDATE picks 
        SET pick_type = $1, player_name = $2, stat_type = $3, line_score = $4
        WHERE user_id = $5 AND projection_id = $6
        RETURNING *
      `, [pickType, playerName, statType, lineScore, userId, projectionId]);
    } else {
      // Create new pick
      result = await pool.query(`
        INSERT INTO picks (user_id, projection_id, pick_type, player_name, stat_type, line_score)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [userId, projectionId, pickType, playerName, statType, lineScore]);
    }

    const pick = result.rows[0];

    res.status(201).json({
      message: 'Pick created successfully',
      pick: {
        id: pick.id,
        projectionId: pick.projection_id,
        pickType: pick.pick_type,
        playerName: pick.player_name,
        statType: pick.stat_type,
        lineScore: pick.line_score,
        outcome: pick.outcome,
        isResolved: pick.is_resolved,
        createdAt: pick.created_at
      }
    });
  } catch (error) {
    console.error('Create pick error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getUserPicks = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const result = await pool.query(`
      SELECT * FROM picks 
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `, [userId]);

    const picks = result.rows.map(pick => ({
      id: pick.id,
      projectionId: pick.projection_id,
      pickType: pick.pick_type,
      playerName: pick.player_name,
      statType: pick.stat_type,
      lineScore: pick.line_score,
      outcome: pick.outcome,
      isResolved: pick.is_resolved,
      createdAt: pick.created_at
    }));

    res.json({ picks });
  } catch (error) {
    console.error('Get user picks error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const resolvePick = async (req: AuthRequest, res: Response) => {
  try {
    const { pickId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Get the pick
    const pickResult = await pool.query(
      'SELECT * FROM picks WHERE id = $1 AND user_id = $2',
      [pickId, userId]
    );

    if (pickResult.rows.length === 0) {
      return res.status(404).json({ message: 'Pick not found' });
    }

    const pick = pickResult.rows[0];

    if (pick.is_resolved) {
      return res.status(400).json({ message: 'Pick is already resolved' });
    }

    // Simulate the outcome
    const outcome = simulatePickOutcome(pick.pick_type, pick.line_score);

    // Update the pick
    const updateResult = await pool.query(`
      UPDATE picks 
      SET outcome = $1, is_resolved = true 
      WHERE id = $2 
      RETURNING *
    `, [outcome, pickId]);

    // Update user's win/loss record
    if (outcome === 'WIN') {
      await pool.query('UPDATE users SET wins = wins + 1 WHERE id = $1', [userId]);
    } else {
      await pool.query('UPDATE users SET losses = losses + 1 WHERE id = $1', [userId]);
    }

    const updatedPick = updateResult.rows[0];

    res.json({
      message: 'Pick resolved successfully',
      pick: {
        id: updatedPick.id,
        projectionId: updatedPick.projection_id,
        pickType: updatedPick.pick_type,
        playerName: updatedPick.player_name,
        statType: updatedPick.stat_type,
        lineScore: updatedPick.line_score,
        outcome: updatedPick.outcome,
        isResolved: updatedPick.is_resolved,
        createdAt: updatedPick.created_at
      }
    });
  } catch (error) {
    console.error('Resolve pick error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const resolveAllPicks = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Get all unresolved picks for the user
    const unresolvedPicks = await pool.query(
      'SELECT * FROM picks WHERE user_id = $1 AND is_resolved = false',
      [userId]
    );

    let wins = 0;
    let losses = 0;

    // Process each pick with 1/3 probability for WIN/LOSS/TBD
    for (const pick of unresolvedPicks.rows) {
      const random = Math.random();
      let outcome: string;
      let shouldResolve = false;
      
      if (random < 0.333) {
        outcome = 'WIN';
        shouldResolve = true;
        wins++;
      } else if (random < 0.666) {
        outcome = 'LOSS';
        shouldResolve = true;
        losses++;
      } else {
        outcome = 'TBD';
        shouldResolve = false; // Keep as unresolved
      }
      
      if (shouldResolve) {
        await pool.query(`
          UPDATE picks 
          SET outcome = $1, is_resolved = true 
          WHERE id = $2
        `, [outcome, pick.id]);
      }
    }

    // Update user's record
    if (wins > 0 || losses > 0) {
      await pool.query(
        'UPDATE users SET wins = wins + $1, losses = losses + $2 WHERE id = $3',
        [wins, losses, userId]
      );
    }

    res.json({
      message: 'All picks resolved successfully',
      resolved: unresolvedPicks.rows.length,
      wins,
      losses
    });
  } catch (error) {
    console.error('Resolve all picks error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
