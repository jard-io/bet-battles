import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet } from 'react-native';

import { ThemedButton } from '@/components/themed-button';
import { ThemedCard } from '@/components/themed-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { getPicksWithOutcomes, getUserStats, simulatePickOutcomes } from '@/utils/authStorage';

interface LeaderboardEntry {
  id: string;
  username: string;
  wins: number;
  losses: number;
  winRate: number;
  streak: number;
  rank: number;
}

export default function LeaderboardScreen() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [userEntry, setUserEntry] = useState<LeaderboardEntry | null>(null);
  const [recentPicks, setRecentPicks] = useState<any[]>([]);

  // Fetch real leaderboard data
  const fetchLeaderboardData = async () => {
    try {
      // First, simulate pick outcomes (1/3 chance each for WIN/LOSS/TBD)
      console.log('Simulating pick outcomes...');
      const outcomeResults = await simulatePickOutcomes();
      
      // Try to fetch real data from backend with authentication
      try {
        const token = await AsyncStorage.getItem('user_auth_token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const [leaderboardResponse, userRankResponse] = await Promise.all([
          fetch('http://localhost:3000/api/leaderboard', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }),
          fetch('http://localhost:3000/api/leaderboard/my-rank', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          })
        ]);

        if (leaderboardResponse.ok && userRankResponse.ok) {
          const leaderboardData = await leaderboardResponse.json();
          const userRankData = await userRankResponse.json();
          
          console.log('Real leaderboard data:', leaderboardData);
          console.log('Real user rank data:', userRankData);
          
          setLeaderboard(leaderboardData.leaderboard || []);
          setUserEntry(userRankData.userRank || null);
          
          // Get recent picks for display
          const allPicks = await getPicksWithOutcomes();
          const recentUserPicks = allPicks
            .slice(-10)
            .reverse()
            .map(pick => ({
              ...pick,
              statusIcon: pick.outcome === 'WIN' ? '✅' : pick.outcome === 'LOSS' ? '❌' : '⏳',
              statusColor: pick.outcome === 'WIN' ? '#10B981' : pick.outcome === 'LOSS' ? '#EF4444' : '#F59E0B'
            }));
          
          setRecentPicks(recentUserPicks);
          return;
        }
      } catch (apiError) {
        console.log('API error:', apiError);
      }

      // Fallback: if API fails, show empty leaderboard with just current user
      const userStats = await getUserStats();
      const allPicks = await getPicksWithOutcomes();
      
      console.log('Fallback - User stats from database:', userStats);
      console.log('Fallback - All picks from database:', allPicks);
      
      // Get recent picks for display (last 10)
      const recentUserPicks = allPicks
        .slice(-10)
        .reverse()
        .map(pick => ({
          ...pick,
          statusIcon: pick.outcome === 'WIN' ? '✅' : pick.outcome === 'LOSS' ? '❌' : '⏳',
          statusColor: pick.outcome === 'WIN' ? '#10B981' : pick.outcome === 'LOSS' ? '#EF4444' : '#F59E0B'
        }));
      
      setRecentPicks(recentUserPicks);
      
      // Show just the current user if no other data available
      const userEntry: LeaderboardEntry = {
        id: 'current',
        username: 'You',
        wins: userStats.wins,
        losses: userStats.losses,
        winRate: userStats.winRate,
        streak: 0, // TODO: Calculate streak from picks
        rank: 1,
      };

      setLeaderboard([]); // Empty leaderboard 
      setUserEntry(userEntry);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };

  useEffect(() => {
    fetchLeaderboardData();
  }, []);

  // Refresh leaderboard when tab comes into focus (e.g., after accepting a bet)
  useFocusEffect(
    useCallback(() => {
      fetchLeaderboardData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchLeaderboardData().finally(() => setRefreshing(false));
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return { name: 'trophy.fill', color: '#FFD700' };
      case 2:
        return { name: 'medal.fill', color: '#C0C0C0' };
      case 3:
        return { name: 'medal.fill', color: '#CD7F32' };
      default:
        return { name: 'number.circle.fill', color: '#8B5CF6' };
    }
  };

  const getStreakColor = (streak: number) => {
    if (streak > 0) return '#10B981'; // Green for winning streak
    if (streak < 0) return '#EF4444'; // Red for losing streak
    return '#6B7280'; // Gray for no streak
  };

  const renderLeaderboardEntry = (entry: LeaderboardEntry, isUser: boolean = false) => (
    <ThemedCard 
      key={entry.id} 
      variant={isUser ? "elevated" : "outlined"} 
      style={[styles.entryCard, isUser && styles.userCard]}
    >
      <ThemedView style={styles.entryHeader}>
        <ThemedView style={styles.rankContainer}>
          <IconSymbol 
            size={24} 
            name={getRankIcon(entry.rank).name as any} 
            color={getRankIcon(entry.rank).color} 
          />
          <ThemedText type="defaultSemiBold" style={styles.rank}>
            #{entry.rank}
          </ThemedText>
        </ThemedView>
        
        <ThemedView style={styles.userInfo}>
          <ThemedText type="subtitle" style={styles.username}>
            {entry.username} {isUser && '(You)'}
          </ThemedText>
          <ThemedText type="body" style={styles.record}>
            {entry.wins}W - {entry.losses}L
          </ThemedText>
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.statsContainer}>
        <ThemedView style={styles.statItem}>
          <ThemedText type="body" style={styles.statLabel}>
            Win Rate
          </ThemedText>
          <ThemedText type="defaultSemiBold" style={styles.statValue}>
            {entry.winRate.toFixed(1)}%
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.statItem}>
          <ThemedText type="body" style={styles.statLabel}>
            Streak
          </ThemedText>
          <ThemedText 
            type="defaultSemiBold" 
            style={[styles.statValue, { color: getStreakColor(entry.streak) }]}
          >
            {entry.streak > 0 ? `+${entry.streak}` : entry.streak}
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.statItem}>
          <ThemedText type="body" style={styles.statLabel}>
            Total
          </ThemedText>
          <ThemedText type="defaultSemiBold" style={styles.statValue}>
            {entry.wins + entry.losses}
          </ThemedText>
        </ThemedView>
      </ThemedView>
    </ThemedCard>
  );

  return (
    <ThemedView style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <ThemedView style={styles.headerSection}>
          <IconSymbol size={48} name="trophy.fill" color="#FFD700" style={styles.headerIcon} />
          <ThemedText type="title" style={styles.headerTitle}>
            Leaderboard
          </ThemedText>
          <ThemedText type="body" style={styles.headerSubtitle}>
            Compete with friends and track your pick accuracy
          </ThemedText>
        </ThemedView>

        {/* Your Rank */}
        {userEntry && (
          <ThemedView style={styles.yourRankSection}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Your Rank
            </ThemedText>
            {renderLeaderboardEntry(userEntry, true)}
          </ThemedView>
        )}

        {/* Recent Picks */}
        {recentPicks.length > 0 && (
          <ThemedView style={styles.recentPicksSection}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Recent Picks
            </ThemedText>
            <ThemedView style={styles.picksContainer}>
              {recentPicks.map((pick, index) => (
                <ThemedCard key={index} variant="outlined" style={styles.pickCard}>
                  <ThemedView style={styles.pickRow}>
                    <ThemedView style={styles.pickInfo}>
                      <ThemedView style={styles.pickPlayerRow}>
                        <ThemedText type="defaultSemiBold" style={styles.pickPlayer}>
                          {pick.playerName}
                        </ThemedText>
                        {pick.isCustomBet && (
                          <ThemedView style={styles.customBetBadge}>
                            <ThemedText type="caption" style={styles.customBetText}>
                              CUSTOM
                            </ThemedText>
                          </ThemedView>
                        )}
                      </ThemedView>
                      <ThemedText type="body" style={styles.pickDetails}>
                        {pick.pickType} {pick.lineScore} {pick.statType}
                      </ThemedText>
                    </ThemedView>
                    <ThemedView style={styles.pickStatus}>
                      <ThemedText style={[styles.statusIcon, { color: pick.statusColor }]}>
                        {pick.statusIcon}
                      </ThemedText>
                      <ThemedText 
                        type="body" 
                        style={[styles.statusText, { color: pick.statusColor }]}
                      >
                        {pick.outcome || 'TBD'}
                      </ThemedText>
                    </ThemedView>
                  </ThemedView>
                </ThemedCard>
              ))}
            </ThemedView>
          </ThemedView>
        )}

        {/* Top Players */}
        <ThemedView style={styles.leaderboardSection}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Top Players
          </ThemedText>
          <ThemedView style={styles.entriesContainer}>
            {leaderboard.map(entry => renderLeaderboardEntry(entry))}
          </ThemedView>
        </ThemedView>

        {/* Actions */}
        <ThemedView style={styles.actionsSection}>
          <ThemedButton
            title="Invite Friends"
            variant="primary"
            size="large"
            style={styles.actionButton}
            onPress={() => alert('Share app with friends!')}
          />
          <ThemedButton
            title="View Full Stats"
            variant="outline"
            size="medium"
            style={styles.actionButton}
            onPress={() => alert('Coming soon!')}
          />
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  headerSection: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 24,
    alignItems: 'center',
  },
  headerIcon: {
    marginBottom: 16,
  },
  headerTitle: {
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    textAlign: 'center',
    opacity: 0.8,
    maxWidth: 300,
  },
  yourRankSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    marginBottom: 16,
    opacity: 0.9,
  },
  leaderboardSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  entriesContainer: {
    gap: 12,
  },
  entryCard: {
    marginVertical: 0,
  },
  userCard: {
    borderWidth: 2,
    borderColor: '#8B5CF6',
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  rankContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 16,
  },
  rank: {
    minWidth: 32,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    marginBottom: 2,
  },
  record: {
    opacity: 0.7,
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
  },
  actionsSection: {
    paddingHorizontal: 20,
    paddingVertical: 32,
    gap: 12,
  },
  actionButton: {
    width: '100%',
  },
  recentPicksSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  picksContainer: {
    gap: 8,
  },
  pickCard: {
    marginVertical: 0,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  pickRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickInfo: {
    flex: 1,
    marginRight: 16,
  },
  pickPlayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  pickPlayer: {
    fontSize: 14,
  },
  customBetBadge: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  customBetText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  pickDetails: {
    opacity: 0.7,
    fontSize: 12,
  },
  pickStatus: {
    alignItems: 'center',
    gap: 4,
  },
  statusIcon: {
    fontSize: 16,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});
