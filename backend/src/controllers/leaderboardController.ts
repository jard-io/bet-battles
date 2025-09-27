import { Response } from 'express';
import { AuthRequest } from '../types';
import pool from '../utils/database';

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

    const leaderboard = result.rows.map(row => ({
      id: row.id,
      username: row.username,
      wins: row.wins,
      losses: row.losses,
      totalPicks: row.total_picks,
      winRate: parseFloat(row.win_rate),
      rank: parseInt(row.rank)
    }));

    res.json({ leaderboard });
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

    const userRank = {
      id: userId,
      username: result.rows[0].username,
      wins: result.rows[0].wins,
      losses: result.rows[0].losses,
      totalPicks: result.rows[0].total_picks,
      winRate: parseFloat(result.rows[0].win_rate),
      rank: parseInt(result.rows[0].rank)
    };

    res.json({ userRank });
  } catch (error) {
    console.error('Get user rank error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
