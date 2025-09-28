import { Response } from 'express';
import { AuthRequest } from '../types';
import pool from '../utils/database';

// Simple in-memory cache
let cache: {
  data: any;
  timestamp: number;
} | null = null;

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// Helper function to merge picks with projections
const mergePicksWithProjections = async (projections: any[], userId?: string) => {
  if (!userId) return projections;

  try {
    // Get user's picks for these projections
    const pickResults = await pool.query(
      'SELECT projection_id, pick_type FROM picks WHERE user_id = $1 AND projection_id = ANY($2)',
      [userId, projections.map(p => p.id)]
    );

    const picksMap = new Map();
    pickResults.rows.forEach(pick => {
      picksMap.set(pick.projection_id, pick.pick_type);
    });

    // Merge picks with projections
    return projections.map(projection => ({
      ...projection,
      pick: picksMap.get(projection.id) || undefined
    }));
  } catch (error) {
    console.error('Error fetching user picks:', error);
    return projections;
  }
};

export const getProjections = async (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = (page - 1) * limit;
  const userId = req.user?.id;

  // Check cache first
  if (cache && (Date.now() - cache.timestamp) < CACHE_DURATION) {
    console.log('Returning cached data with pagination');
    
    // Merge picks with cached projections
    const projectionsWithPicks = await mergePicksWithProjections(cache.data.projections, userId);
    const paginatedProjections = projectionsWithPicks.slice(offset, offset + limit);
    
    const paginatedData = {
      projections: paginatedProjections,
      pagination: {
        page,
        limit,
        total: cache.data.projections.length,
        totalPages: Math.ceil(cache.data.projections.length / limit),
        hasMore: offset + limit < cache.data.projections.length
      }
    };
    return res.json(paginatedData);
  }
  try {
    const myHeaders = new Headers();
    myHeaders.append("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36");
    myHeaders.append("Accept", "application/json, text/plain, */*");
    myHeaders.append("Referer", "https://www.prizepicks.com/");
    myHeaders.append("Origin", "https://www.prizepicks.com");
    myHeaders.append("Accept-Language", "en-US,en;q=0.9");
    myHeaders.append("Cache-Control", "no-cache");
    myHeaders.append("Pragma", "no-cache");

    const requestOptions = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow" as const
    };

    const response = await fetch("https://api.prizepicks.com/projections?league_id=9&in_game=true&single_stat=true&game_mode=pickem", requestOptions);

    if (!response.ok) {
      console.error('PrizePicks API error:', response.status, await response.text());
      return res.status(response.status).json({ 
        message: 'Failed to fetch projections',
        status: response.status 
      });
    }

    const result = await response.json();
    
    // Process the data as you did before
    const players = result.included;
    const playerMap = new Map<string, { name: string; imageUrl?: string }>();
    
    for (let i = 0; i < players.length; i++) {
      if (players[i]["type"] === "new_player") {
        const playerData = {
          name: players[i]["attributes"]["name"],
          imageUrl: players[i]["attributes"]["image_url"] || players[i]["attributes"]["image"] || null
        };
        playerMap.set(players[i]["id"], playerData);
      }
    }

    // Process projections
    const projectionsData = result.data;
    const processedProjections = [];

    for (let i = 0; i < projectionsData.length; i++) {
      const projection = projectionsData[i];
      const playerId = projection["relationships"]["new_player"]["data"]["id"];
      const playerData = playerMap.get(playerId) || { name: "Unknown Player", imageUrl: null };
      const statType = projection["attributes"]["stat_type"];
      const lineScore = projection["attributes"]["line_score"];

      processedProjections.push({
        id: projection["id"],
        playerId,
        playerName: playerData.name,
        playerImageUrl: playerData.imageUrl,
        statType,
        lineScore,
      });
    }

    const fullData = { projections: processedProjections };
    
    // Cache the full response
    cache = {
      data: fullData,
      timestamp: Date.now()
    };
    
    // Merge picks with fresh data and return paginated
    const projectionsWithPicks = await mergePicksWithProjections(processedProjections, userId);
    const paginatedProjections = projectionsWithPicks.slice(offset, offset + limit);
    
    const paginatedData = {
      projections: paginatedProjections,
      pagination: {
        page,
        limit,
        total: processedProjections.length,
        totalPages: Math.ceil(processedProjections.length / limit),
        hasMore: offset + limit < processedProjections.length
      }
    };
    
    console.log(`Data fetched from PrizePicks API and cached. Returning page ${page} of ${paginatedData.pagination.totalPages}`);
    res.json(paginatedData);
  } catch (error) {
    console.error('Error fetching PrizePicks data:', error);
    
    // If we have cached data, return it even if it's expired
    if (cache) {
      console.log('API failed, returning stale cached data');
      const projectionsWithPicks = await mergePicksWithProjections(cache.data.projections, userId);
      const paginatedProjections = projectionsWithPicks.slice(offset, offset + limit);
      
      const paginatedData = {
        projections: paginatedProjections,
        pagination: {
          page,
          limit,
          total: cache.data.projections.length,
          totalPages: Math.ceil(cache.data.projections.length / limit),
          hasMore: offset + limit < cache.data.projections.length
        }
      };
      return res.json(paginatedData);
    }
    
    res.status(500).json({ message: 'Internal server error' });
  }
};
