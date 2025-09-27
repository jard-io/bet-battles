import React, { useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet } from 'react-native';

import { ThemedButton } from '@/components/themed-button';
import { ThemedCard } from '@/components/themed-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getPicksFromStorage, savePickToStorage } from '@/utils/authStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';


interface Projection {
  id: string;
  playerId: string;
  playerName: string;
  statType: string;
  lineScore: number;
  pick?: 'OVER' | 'UNDER';
}

export default function BoardScreen() {
  const [projections, setProjections] = useState<Projection[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalItems, setTotalItems] = useState(0);

  const fetchPrizePicks = async (page: number = 1, append: boolean = false) => {
    // Prevent too frequent requests (minimum 3 seconds between calls for pagination)
    const now = Date.now();
    if (now - lastFetchTime < 3000) {
      console.log('Request throttled - too soon since last fetch');
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
      return;
    }

    try {
      setLastFetchTime(now);
      console.log(`Fetching projections from backend... Page ${page}`);
      
      // Get auth token for authenticated API call
      const token = await AsyncStorage.getItem('user_auth_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Use your backend API with pagination
      const response = await fetch(`http://localhost:3000/api/prizepicks/projections?page=${page}&limit=20`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // If backend is not available, show mock data for development
        if (response.status === 0 || !response.status) {
          console.warn('Backend not available, using mock data');
          const mockData = [
            {
              id: '1',
              playerId: 'mock1',
              playerName: 'LeBron James',
              statType: 'Points',
              lineScore: 25.5,
            },
            {
              id: '2',
              playerId: 'mock2',
              playerName: 'Stephen Curry',
              statType: '3-Pointers Made',
              lineScore: 4.5,
            }
          ];

          // Load saved picks for mock data too
          const savedPicks = await getPicksFromStorage();
          const picksMap = new Map<string, string>();
          savedPicks.forEach(pick => {
            picksMap.set(pick.projectionId, pick.pickType);
          });

          const mockDataWithPicks = mockData.map(projection => ({
            ...projection,
            pick: (picksMap.get(projection.id) as 'OVER' | 'UNDER') || undefined
          }));

          setProjections(append ? [...projections, ...mockDataWithPicks] : mockDataWithPicks);
          setHasMore(false);
          setTotalItems(mockData.length);
          return;
        }
        throw new Error("Network response was not ok " + response.statusText);
      }

      const result = await response.json();
      
      // Load saved picks and merge with projections
      const savedPicks = await getPicksFromStorage();
      console.log('Loaded saved picks:', savedPicks);
      
      const picksMap = new Map<string, string>();
      savedPicks.forEach(pick => {
        picksMap.set(pick.projectionId, pick.pickType);
      });
      
      console.log('Picks map:', Object.fromEntries(picksMap));

      // Merge picks with projections
      const projectionsWithPicks = result.projections.map((projection: any) => ({
        ...projection,
        pick: (picksMap.get(projection.id) as 'OVER' | 'UNDER') || undefined
      }));
      
      console.log('First few projections with picks:', projectionsWithPicks.slice(0, 3));
      
      if (append) {
        setProjections(prev => [...prev, ...projectionsWithPicks]);
      } else {
        setProjections(projectionsWithPicks);
      }
      
      setHasMore(result.pagination.hasMore);
      setTotalItems(result.pagination.total);
      setCurrentPage(result.pagination.page);
    } catch (error) {
      console.error('Error fetching PrizePicks data:', error);
      Alert.alert('Error', 'Failed to fetch picks. Please try again.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  // Removed automatic fetching - now manual only

  const handlePick = async (projectionId: string, pickType: 'OVER' | 'UNDER') => {
    // Find the projection to get player details
    const projection = projections.find(p => p.id === projectionId);
    if (!projection) return;

    // Optimistically update UI
    setProjections(prev => 
      prev.map(p => 
        p.id === projectionId 
          ? { ...p, pick: pickType }
          : p
      )
    );

    try {
      // Save pick to local storage
      const success = await savePickToStorage({
        projectionId: projection.id,
        pickType,
        playerName: projection.playerName,
        statType: projection.statType,
        lineScore: projection.lineScore,
      });

      if (!success) {
        // Revert optimistic update on error
        setProjections(prev => 
          prev.map(p => 
            p.id === projectionId 
              ? { ...p, pick: undefined }
              : p
          )
        );
        Alert.alert('Error', 'Failed to save your pick. Please try again.');
      }

      // TODO: Also save to backend when authentication is implemented
      /*
      const response = await fetch('http://localhost:3000/api/picks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          projectionId: projection.id,
          pickType,
          playerName: projection.playerName,
          statType: projection.statType,
          lineScore: projection.lineScore,
        }),
      });
      */
    } catch (error) {
      // Revert optimistic update on error
      setProjections(prev => 
        prev.map(p => 
          p.id === projectionId 
            ? { ...p, pick: undefined }
            : p
        )
      );
      console.error('Error saving pick:', error);
      Alert.alert('Error', 'Failed to save your pick. Please try again.');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setCurrentPage(1);
    setHasMore(true);
    fetchPrizePicks(1, false);
  };

  const handleManualRefresh = () => {
    setLoading(true);
    setCurrentPage(1);
    setHasMore(true);
    fetchPrizePicks(1, false);
  };

  const loadMoreItems = () => {
    if (!loadingMore && hasMore) {
      setLoadingMore(true);
      fetchPrizePicks(currentPage + 1, true);
    }
  };


  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 20;
    
    if (layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom) {
      loadMoreItems();
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onScroll={handleScroll}
        scrollEventThrottle={400}
      >
        {/* Header */}
        <ThemedView style={styles.headerSection}>
          <ThemedText type="title" style={styles.headerTitle}>
            Today&apos;s Picks
          </ThemedText>
          <ThemedText type="body" style={styles.headerSubtitle}>
            {totalItems > 0 ? `${projections.length} of ${totalItems} picks loaded` : 'Choose OVER or UNDER for each player stat'}
          </ThemedText>
          
          {/* Manual Refresh Button */}
          <ThemedView style={styles.refreshButtonContainer}>
            <ThemedButton
              title={loading ? "Loading..." : "Load Picks"}
              variant="primary"
              size="medium"
              style={styles.refreshButton}
              disabled={loading}
              onPress={handleManualRefresh}
            />
          </ThemedView>
        </ThemedView>

        {/* Loading State */}
        {loading && (
          <ThemedView style={styles.loadingContainer}>
            <ThemedText type="body">Loading picks...</ThemedText>
          </ThemedView>
        )}

        {/* Projections */}
        <ThemedView style={styles.picksContainer}>
          {projections.map((projection) => (
            <ThemedCard key={projection.id} variant="elevated" style={styles.pickCard}>
              <ThemedView style={styles.cardHeader}>
                <ThemedText type="subtitle" style={styles.playerName}>
                  {projection.playerName}
                </ThemedText>
                <ThemedText type="body" style={styles.statType}>
                  {projection.statType}
                </ThemedText>
              </ThemedView>
              
              <ThemedView style={styles.lineContainer}>
                <ThemedText type="title" style={styles.lineScore}>
                  {projection.lineScore}
                </ThemedText>
              </ThemedView>

              <ThemedView style={styles.pickButtons}>
                <ThemedButton
                  title="OVER"
                  variant={projection.pick === 'OVER' ? 'primary' : 'outline'}
                  size="medium"
                  style={styles.pickButton}
                  onPress={() => handlePick(projection.id, 'OVER')}
                />
                <ThemedButton
                  title="UNDER"
                  variant={projection.pick === 'UNDER' ? 'primary' : 'outline'}
                  size="medium"
                  style={styles.pickButton}
                  onPress={() => handlePick(projection.id, 'UNDER')}
                />
              </ThemedView>
            </ThemedCard>
          ))}
        </ThemedView>

        {/* Loading more indicator */}
        {loadingMore && (
          <ThemedView style={styles.loadingMoreContainer}>
            <ThemedText type="body" style={styles.loadingMoreText}>
              Loading more picks...
            </ThemedText>
          </ThemedView>
        )}

        {/* End of data indicator */}
        {!loading && !loadingMore && projections.length > 0 && !hasMore && (
          <ThemedView style={styles.endContainer}>
            <ThemedText type="body" style={styles.endText}>
              🎉 You&apos;ve seen all {totalItems} picks!
            </ThemedText>
          </ThemedView>
        )}

        {/* No picks state */}
        {!loading && projections.length === 0 && (
          <ThemedView style={styles.emptyContainer}>
            <ThemedText type="body" style={styles.emptyText}>
              No picks loaded yet. Tap "Load Picks" to fetch the latest projections.
            </ThemedText>
          </ThemedView>
        )}
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
  headerTitle: {
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    textAlign: 'center',
    opacity: 0.8,
    marginBottom: 20,
  },
  refreshButtonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  refreshButton: {
    width: '80%',
    maxWidth: 200,
  },
  loadingContainer: {
    paddingHorizontal: 20,
    paddingVertical: 40,
    alignItems: 'center',
  },
  picksContainer: {
    paddingHorizontal: 20,
    gap: 16,
    paddingBottom: 20,
  },
  pickCard: {
    marginVertical: 0,
  },
  cardHeader: {
    marginBottom: 12,
  },
  playerName: {
    marginBottom: 4,
  },
  statType: {
    opacity: 0.7,
    textTransform: 'uppercase',
    fontSize: 12,
    fontWeight: '600',
  },
  lineContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  lineScore: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  pickButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  pickButton: {
    flex: 1,
  },
  emptyContainer: {
    paddingHorizontal: 20,
    paddingVertical: 40,
    alignItems: 'center',
    gap: 16,
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.8,
  },
  loadingMoreContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadingMoreText: {
    opacity: 0.7,
    fontSize: 14,
  },
  endContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: 'center',
  },
  endText: {
    textAlign: 'center',
    opacity: 0.7,
    fontSize: 14,
  },
});
