import { Response } from 'express';
import { AuthRequest } from '../types';
import pool from '../utils/database';

// Calculate current streak for a user based on their recent picks
const calculateUserStreak = async (userId: string): Promise<number> => {
  try {
    // Get all resolved picks for the user, ordered by most recent first
    const picksResult = await pool.query(`
      SELECT outcome, created_at
      FROM picks 
      WHERE user_id = $1 AND is_resolved = true AND outcome IN ('WIN', 'LOSS')
      ORDER BY created_at DESC
    `, [userId]);

    // Also get custom bet outcomes for the user
    const customBetsResult = await pool.query(`
      SELECT cbp.outcome, cb.created_at
      FROM custom_bet_participants cbp
      JOIN custom_bets cb ON cbp.bet_id = cb.id
      WHERE cbp.user_id = $1 AND cbp.outcome IN ('WIN', 'LOSS')
      ORDER BY cb.created_at DESC
    `, [userId]);

    // Combine and sort all picks by date (most recent first)
    const allPicks = [
      ...picksResult.rows.map(pick => ({ outcome: pick.outcome, created_at: pick.created_at })),
      ...customBetsResult.rows.map(bet => ({ outcome: bet.outcome, created_at: bet.created_at }))
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    if (allPicks.length === 0) return 0;

    // Calculate current streak
    let streak = 0;
    const firstOutcome = allPicks[0].outcome;
    
    for (const pick of allPicks) {
      if (pick.outcome === firstOutcome) {
        streak += (firstOutcome === 'WIN' ? 1 : -1);
      } else {
        break; // Streak is broken
      }
    }

    return streak;
  } catch (error) {
    console.error('Error calculating streak for user:', userId, error);
    return 0;
  }
};

export const getLeaderboard = async (req: AuthRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    // Get leaderboard with win rate calculation
    const result = await pool.query(`
      SELECT 
        id,
        username,
        wins,
        losses,
        (wins + losses) as total_picks,
        CASE 
          WHEN (wins + losses) > 0 THEN ROUND((wins::decimal / (wins + losses)) * 100, 1)
          ELSE 0 
        END as win_rate,
        ROW_NUMBER() OVER (ORDER BY 
          CASE 
            WHEN (wins + losses) > 0 THEN (wins::decimal / (wins + losses))
            ELSE 0 
          END DESC, 
          wins DESC
        ) as rank
      FROM users 
      WHERE (wins + losses) > 0  -- Only show users who have made picks
      ORDER BY 
        CASE 
          WHEN (wins + losses) > 0 THEN (wins::decimal / (wins + losses))
          ELSE 0 
        END DESC, 
        wins DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    // Calculate streaks for all users
    const leaderboardWithStreaks = await Promise.all(
      result.rows.map(async (row) => {
        const streak = await calculateUserStreak(row.id);
        return {
          id: row.id,
          username: row.username,
          wins: row.wins,
          losses: row.losses,
          totalPicks: row.total_picks,
          winRate: parseFloat(row.win_rate),
          streak: streak,
          rank: parseInt(row.rank)
        };
      })
    );

    res.json({ leaderboard: leaderboardWithStreaks });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getUserRank = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Get user's rank
    const result = await pool.query(`
      SELECT 
        rank_data.rank,
        rank_data.username,
        rank_data.wins,
        rank_data.losses,
        rank_data.total_picks,
        rank_data.win_rate
      FROM (
        SELECT 
          id,
          username,
          wins,
          losses,
          (wins + losses) as total_picks,
          CASE 
            WHEN (wins + losses) > 0 THEN ROUND((wins::decimal / (wins + losses)) * 100, 1)
            ELSE 0 
          END as win_rate,
          ROW_NUMBER() OVER (ORDER BY 
            CASE 
              WHEN (wins + losses) > 0 THEN (wins::decimal / (wins + losses))
              ELSE 0 
            END DESC, 
            wins DESC
          ) as rank
        FROM users
      ) rank_data
      WHERE rank_data.id = $1
    `, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Calculate streak for the user
    const streak = await calculateUserStreak(userId);

    const userRank = {
      id: userId,
      username: result.rows[0].username,
      wins: result.rows[0].wins,
      losses: result.rows[0].losses,
      totalPicks: result.rows[0].total_picks,
      winRate: parseFloat(result.rows[0].win_rate),
      streak: streak,
      rank: parseInt(result.rows[0].rank)
    };

    res.json({ userRank });
  } catch (error) {
    console.error('Get user rank error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
