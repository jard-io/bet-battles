// Authentication-based storage - replaces device ID approach

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface StoredPick {
  projectionId: string;
  pickType: 'OVER' | 'UNDER';
  playerName: string;
  playerImageUrl?: string;
  statType: string;
  lineScore: number;
  timestamp: number;
  outcome?: 'WIN' | 'LOSS' | 'TBD';
  lastChecked?: number;
  isCustomBet?: boolean; // Flag to distinguish custom bets from regular picks
}

export interface UserStats {
  wins: number;
  losses: number;
  winRate: number;
  totalPicks: number;
}

const API_BASE_URL = 'http://localhost:3001/api';
const AUTH_STORAGE_KEY = 'user_auth_token';
const USER_STORAGE_KEY = 'user_data';

// Get authentication token
const getAuthToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(AUTH_STORAGE_KEY);
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

// Get current user data
export const getCurrentUser = async () => {
  try {
    const userData = await AsyncStorage.getItem(USER_STORAGE_KEY);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};

// Check if user is authenticated
export const isAuthenticated = async (): Promise<boolean> => {
  const token = await getAuthToken();
  return !!token;
};

// Helper function to make authenticated API calls
const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const token = await getAuthToken();
  
  if (!token) {
    throw new Error('User not authenticated');
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('API call failed:', response.status, response.statusText, errorData);
    throw new Error(`API call failed: ${response.statusText} - ${errorData}`);
  }

  return response.json();
};

// Save pick to database
export const savePickToStorage = async (pick: Omit<StoredPick, 'timestamp'>) => {
  try {
    const requestData = {
      projectionId: pick.projectionId,
      pickType: pick.pickType,
      playerName: pick.playerName,
      playerImageUrl: pick.playerImageUrl,
      statType: pick.statType,
      lineScore: pick.lineScore,
    };
    
    console.log('Saving pick with authentication:', requestData);
    
    const result = await apiCall('/picks', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
    
    console.log('Pick saved to database successfully:', result);
    return true;
  } catch (error) {
    console.error('Error saving pick to database:', error);
    return false;
  }
};

// Get picks from database
export const getPicksFromStorage = async (): Promise<StoredPick[]> => {
  try {
    console.log('Getting picks for authenticated user');
    
    const response = await apiCall('/picks');
    console.log('Raw database response:', response);
    
    if (!response || !response.picks || !Array.isArray(response.picks)) {
      console.log('No picks found in response:', response);
      return [];
    }
    
    const databasePicks = response.picks.map((pick: any) => {
      console.log('Processing pick from database:', pick);
      return {
        projectionId: pick.projectionId,
        pickType: pick.pickType,
        playerName: pick.playerName,
        playerImageUrl: pick.playerImageUrl,
        statType: pick.statType,
        lineScore: pick.lineScore,
        timestamp: new Date(pick.createdAt).getTime(),
        outcome: pick.outcome as 'WIN' | 'LOSS' | 'TBD' | undefined,
        lastChecked: pick.isResolved ? new Date(pick.createdAt).getTime() : undefined,
      };
    });
    
    console.log('Mapped picks for matching:', databasePicks.map(p => ({ id: p.projectionId, type: p.pickType })));
    return databasePicks;
  } catch (error) {
    console.error('Error getting picks from database:', error);
    return [];
  }
};

// Get user stats from database
export const getUserStats = async (): Promise<UserStats> => {
  try {
    const response = await apiCall('/leaderboard/my-rank');
    
    if (response.userRank) {
      return {
        wins: response.userRank.wins || 0,
        losses: response.userRank.losses || 0,
        winRate: response.userRank.winRate || 0,
        totalPicks: (response.userRank.wins || 0) + (response.userRank.losses || 0),
      };
    }
    
    return { wins: 0, losses: 0, winRate: 0, totalPicks: 0 };
  } catch (error) {
    console.error('Error getting user stats from database:', error);
    return { wins: 0, losses: 0, winRate: 0, totalPicks: 0 };
  }
};

// Update user stats (handled automatically by backend when picks are resolved)
export const updateUserStats = async (wins: number, losses: number) => {
  return {
    wins,
    losses,
    winRate: wins + losses > 0 ? (wins / (wins + losses)) * 100 : 0,
    totalPicks: wins + losses
  };
};

// Simulate pick outcomes via database
export const simulatePickOutcomes = async () => {
  try {
    const response = await apiCall('/picks/resolve-all', {
      method: 'POST',
    });
    
    console.log('Pick outcomes simulated via database');
    
    return {
      newWins: response.wins || 0,
      newLosses: response.losses || 0,
      totalPicks: response.resolved || 0,
    };
  } catch (error) {
    console.error('Error simulating pick outcomes:', error);
    return { newWins: 0, newLosses: 0, totalPicks: 0 };
  }
};

// Get picks with their current status
// Get custom bet picks in the same format as regular picks
export const getCustomBetPicks = async (): Promise<StoredPick[]> => {
  try {
    console.log('Getting custom bet picks for authenticated user');
    
    const response = await apiCall('/custom-bets');
    console.log('Custom bets response:', response);
    
    if (!response || !response.bets || !Array.isArray(response.bets)) {
      console.log('No custom bets found in response:', response);
      return [];
    }
    
    const customBetPicks: StoredPick[] = [];
    
    // Get current user ID from backend to ensure consistency
    const authCurrentUser = await apiCall('/auth/profile', { method: 'GET' });
    const currentUserId = authCurrentUser?.user?.id;
    
    for (const bet of response.bets) {
      // Find current user's participation in this bet
      const userParticipation = bet.participants?.find((p: any) => p.userId === currentUserId);
      
      
      // Include bets where user participated and either:
      // 1. There's a resolved outcome (WIN/LOSS/TBD), or  
      // 2. The bet is accepted (meaning it's active but not yet resolved)
      // Exclude: PENDING (not yet accepted), DECLINED (rejected), COMPLETED without participation
      if (userParticipation && (userParticipation.outcome || bet.status === 'ACCEPTED')) {
        customBetPicks.push({
          projectionId: `custom-${bet.id}`, // Prefix to distinguish from regular picks
          pickType: userParticipation.pickType as 'OVER' | 'UNDER',
          playerName: bet.player,
          statType: bet.stat,
          lineScore: bet.line,
          timestamp: new Date(bet.createdAt || Date.now()).getTime(),
          outcome: userParticipation.outcome || (bet.status === 'ACCEPTED' ? 'TBD' : undefined) as 'WIN' | 'LOSS' | 'TBD',
          lastChecked: userParticipation.outcome && userParticipation.outcome !== 'TBD' ? new Date(bet.updatedAt || bet.createdAt || Date.now()).getTime() : undefined,
          isCustomBet: true, // Flag to identify custom bets
        });
      }
    }
    
    console.log('Mapped custom bet picks:', customBetPicks);
    return customBetPicks;
  } catch (error) {
    console.error('Error getting custom bet picks:', error);
    return [];
  }
};

// Get picks with their outcomes for leaderboard display (includes both regular and custom bets)
export const getPicksWithOutcomes = async (): Promise<StoredPick[]> => {
  try {
    const [regularPicks, customBetPicks] = await Promise.all([
      getPicksFromStorage(),
      getCustomBetPicks()
    ]);
    
    // Combine and sort by timestamp (newest first)
    const allPicks = [...regularPicks, ...customBetPicks].sort((a, b) => b.timestamp - a.timestamp);
    
    console.log('Combined picks (regular + custom bets):', allPicks.length);
    return allPicks;
  } catch (error) {
    console.error('Error getting picks with outcomes:', error);
    return await getPicksFromStorage(); // Fallback to just regular picks
  }
};

// Get a specific pick for a projection
export const getPickForProjection = async (projectionId: string): Promise<StoredPick | null> => {
  try {
    const picks = await getPicksFromStorage();
    return picks.find(p => p.projectionId === projectionId) || null;
  } catch (error) {
    console.error('Error getting pick for projection:', error);
    return null;
  }
};

// Logout user
export const logout = async () => {
  try {
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    await AsyncStorage.removeItem(USER_STORAGE_KEY);
    console.log('User logged out successfully');
    return true;
  } catch (error) {
    console.error('Error logging out:', error);
    return false;
  }
};
