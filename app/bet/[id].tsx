import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedButton } from '@/components/themed-button';
import { ThemedCard } from '@/components/themed-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface BetDetails {
  id: string;
  player: string;
  stat: string;
  line: number;
  creator: string;
  creatorId: string;
  creatorUsername: string;
  creatorPickType: 'OVER' | 'UNDER';
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'COMPLETED';
  outcome?: 'WIN' | 'LOSS' | 'TBD';
  participants: any[];
  createdAt: string;
}

export default function BetAcceptScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [bet, setBet] = useState<BetDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Helper function to make authenticated API calls
  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const token = await AsyncStorage.getItem('user_auth_token');
    if (!token) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(`http://localhost:3001/api${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`API call failed: ${response.statusText} - ${errorData}`);
    }

    return response.json();
  };

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated && id) {
      loadBetDetails();
    }
  }, [isAuthenticated, id]);

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('user_auth_token');
      const userData = await AsyncStorage.getItem('user_data');
      
      if (token && userData) {
        setCurrentUser(JSON.parse(userData));
        setIsAuthenticated(true);
      } else {
        // Redirect to login if not authenticated
        Alert.alert(
          'Login Required',
          'You need to be logged in to accept bets. Please create an account or log in.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Go to Login', onPress: () => router.replace('/auth') }
          ]
        );
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      router.replace('/auth');
    }
  };

  const loadBetDetails = async () => {
    try {
      setLoading(true);
      const response = await apiCall(`/custom-bets/${id}`);
      
      // Map the response to match our interface
      const mappedBet = {
        ...response.bet,
        creator: response.bet.creatorUsername || response.bet.creator_username || 'Unknown',
        creatorUsername: response.bet.creatorUsername || response.bet.creator_username,
        creatorPickType: response.bet.creatorPickType || response.bet.creator_pick_type || 'OVER',
        participants: response.bet.participants || []
      };
      
      console.log('Loaded bet details:', mappedBet);
      setBet(mappedBet);
    } catch (error) {
      console.error('Error loading bet details:', error);
      Alert.alert('Error', 'Failed to load bet details');
    } finally {
      setLoading(false);
    }
  };

  const acceptBet = async () => {
    if (!bet || !currentUser) return;

    try {
      setLoading(true);
      const response = await apiCall(`/custom-bets/${bet.id}/accept`, {
        method: 'POST',
      });
      
      console.log('Bet accepted successfully, redirecting...', response);
      // Redirect immediately to custom bets tab
      router.replace('/(tabs)/custom-bets');
    } catch (error) {
      console.error('Error accepting bet:', error);
      Alert.alert('Error', 'Failed to accept bet. You may have already accepted it or it may no longer be available.');
    } finally {
      setLoading(false);
    }
  };

  const declineBet = async () => {
    if (!bet) return;

    try {
      setLoading(true);
      await apiCall(`/custom-bets/${bet.id}/decline`, {
        method: 'POST',
      });
      
      console.log('Bet declined successfully, redirecting...');
      // Redirect immediately to board tab
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error declining bet:', error);
      Alert.alert('Error', 'Failed to decline bet');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#F59E0B';
      case 'accepted':
        return '#10B981';
      case 'declined':
        return '#EF4444';
      case 'completed':
        return '#6B7280';
      default:
        return '#8B5CF6';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return 'clock.fill';
      case 'accepted':
        return 'checkmark.circle.fill';
      case 'declined':
        return 'xmark.circle.fill';
      case 'completed':
        return 'flag.checkered';
      default:
        return 'questionmark.circle.fill';
    }
  };

  if (!isAuthenticated) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.centerContent}>
          <IconSymbol size={64} name="person.circle" color="#8B5CF6" style={styles.icon} />
          <ThemedText type="title" style={styles.title}>Login Required</ThemedText>
          <ThemedText type="body" style={styles.subtitle}>
            You need to be logged in to accept custom bets
          </ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  if (loading && !bet) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.centerContent}>
          <IconSymbol size={64} name="clock.fill" color="#8B5CF6" style={styles.icon} />
          <ThemedText type="title" style={styles.title}>Loading Bet...</ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  if (!bet) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.centerContent}>
          <IconSymbol size={64} name="exclamationmark.triangle" color="#EF4444" style={styles.icon} />
          <ThemedText type="title" style={styles.title}>Bet Not Found</ThemedText>
          <ThemedText type="body" style={styles.subtitle}>
            This bet may no longer be available or the link is invalid
          </ThemedText>
          <ThemedButton
            title="Go to App"
            onPress={() => router.push('/(tabs)')}
            style={styles.button}
          />
        </ThemedView>
      </ThemedView>
    );
  }

  const isCreator = bet.creatorId === currentUser?.id;
  const hasParticipated = bet.participants.some(p => p.userId === currentUser?.id);
  const canAccept = bet.status === 'PENDING' && !isCreator && !hasParticipated;

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <ThemedView style={styles.headerSection}>
          {/* BetBattles Logo - positioned absolutely */}
          <View style={styles.logoContainer}>
            <Image 
              source={require('@/assets/images/betbattles-logo.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          
          <IconSymbol size={48} name="target" color="#8B5CF6" style={styles.headerIcon} />
          <ThemedText type="title" style={styles.contentTitle}>
            Custom Bet Challenge
          </ThemedText>
          <ThemedText type="body" style={styles.headerSubtitle}>
            {bet.creator} has challenged you to a bet!
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.content}>
          <ThemedCard style={styles.betCard}>
          <ThemedView style={[styles.betHeader, { backgroundColor: 'transparent' }]}>
            <ThemedView style={[styles.betInfo, { backgroundColor: 'transparent' }]}>
              <ThemedText type="subtitle" style={styles.playerName}>
                {bet.player}
              </ThemedText>
              <ThemedText type="body" style={styles.statInfo}>
                {bet.stat} - Line: {bet.line}
              </ThemedText>
              <ThemedText type="body" style={styles.creatorInfo}>
                Created by: {bet.creator}
              </ThemedText>
            </ThemedView>

            <ThemedView style={[styles.statusContainer, { backgroundColor: 'transparent' }]}>
              <IconSymbol
                size={20}
                name={getStatusIcon(bet.status)}
                color={getStatusColor(bet.status)}
              />
              <ThemedText
                type="body"
                style={[styles.statusText, { color: getStatusColor(bet.status) }]}
              >
                {bet.status.toUpperCase()}
              </ThemedText>
            </ThemedView>
          </ThemedView>


          {canAccept && (
            <ThemedView style={[styles.pickDisplayContainer, { backgroundColor: 'transparent' }]}>
              <ThemedText type="subtitle" style={styles.pickDisplayTitle}>
                If you accept this bet:
              </ThemedText>
              <ThemedView style={[styles.pickComparison, { backgroundColor: 'transparent' }]}>
                <ThemedView style={[styles.pickSide, { backgroundColor: 'transparent' }]}>
                  <ThemedText type="body" style={styles.pickLabel}>
                    {bet.creator} gets:
                  </ThemedText>
                  <ThemedView style={[styles.pickBadge, styles.creatorBadge]}>
                    <ThemedText type="defaultSemiBold" style={styles.pickText}>
                      {bet.creatorPickType} {bet.line}
                    </ThemedText>
                  </ThemedView>
                </ThemedView>
                
                <ThemedText type="body" style={styles.vsText}>VS</ThemedText>
                
                <ThemedView style={[styles.pickSide, { backgroundColor: 'transparent' }]}>
                  <ThemedText type="body" style={styles.pickLabel}>
                    You get:
                  </ThemedText>
                  <ThemedView style={[styles.pickBadge, styles.acceptorBadge]}>
                    <ThemedText type="defaultSemiBold" style={styles.pickText}>
                      {bet.creatorPickType === 'OVER' ? 'UNDER' : 'OVER'} {bet.line}
                    </ThemedText>
                  </ThemedView>
                </ThemedView>
              </ThemedView>
            </ThemedView>
          )}

          {bet.outcome && (
            <ThemedView style={[styles.outcomeContainer, { backgroundColor: 'transparent' }]}>
              <ThemedText
                type="defaultSemiBold"
                style={[
                  styles.outcomeText,
                  { color: bet.outcome === 'WIN' ? '#10B981' : bet.outcome === 'LOSS' ? '#EF4444' : '#F59E0B' }
                ]}
              >
                {bet.outcome === 'WIN' ? '🎉 Bet Won!' : bet.outcome === 'LOSS' ? '😔 Bet Lost' : '⏳ Pending Result'}
              </ThemedText>
            </ThemedView>
          )}

          {canAccept && (
            <ThemedView style={[styles.actionButtons, { backgroundColor: 'transparent' }]}>
              <ThemedButton
                title={loading ? "Accepting..." : `Accept Bet (${bet.creatorPickType === 'OVER' ? 'UNDER' : 'OVER'})`}
                variant="primary"
                size="large"
                style={styles.acceptButton}
                onPress={acceptBet}
                disabled={loading}
              />
              <ThemedButton
                title="Decline"
                variant="outline"
                size="large"
                style={styles.declineButton}
                onPress={declineBet}
                disabled={loading}
              />
            </ThemedView>
          )}

          {isCreator && (
            <ThemedView style={[styles.creatorMessage, { backgroundColor: 'transparent' }]}>
              <ThemedText type="body" style={styles.creatorText}>
                🎯 This is your bet! Share the link with friends to challenge them.
              </ThemedText>
            </ThemedView>
          )}

          {hasParticipated && !isCreator && (
            <ThemedView style={styles.participatedMessage}>
              <ThemedText type="body" style={styles.participatedText}>
                ✅ You have already accepted this bet!
              </ThemedText>
            </ThemedView>
          )}

          {(bet.status === 'DECLINED' || bet.status === 'COMPLETED') && !isCreator && !hasParticipated && (
            <ThemedView style={styles.unavailableMessage}>
              <ThemedText type="body" style={styles.unavailableText}>
                This bet is no longer available for new participants.
              </ThemedText>
            </ThemedView>
          )}
          </ThemedCard>

          <ThemedButton
            title="View All Custom Bets"
            variant="ghost"
            onPress={() => router.push('/(tabs)/custom-bets')}
            style={styles.viewAllButton}
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
    position: 'relative',
    paddingHorizontal: 20,
    paddingTop: 70,
    paddingBottom: 24,
    alignItems: 'center',
  },
  logoContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 1,
  },
  logo: {
    width: 60,
    height: 60,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerIcon: {
    marginBottom: 16,
  },
  contentTitle: {
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    textAlign: 'center',
    opacity: 0.8,
    maxWidth: 300,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  icon: {
    marginBottom: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 24,
  },
  button: {
    minWidth: 120,
  },
  betCard: {
    marginBottom: 24,
  },
  betHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  betInfo: {
    flex: 1,
    marginRight: 16,
  },
  playerName: {
    marginBottom: 4,
  },
  statInfo: {
    opacity: 0.8,
    marginBottom: 2,
  },
  creatorInfo: {
    opacity: 0.6,
    fontSize: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  outcomeContainer: {
    marginBottom: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    alignItems: 'center',
  },
  outcomeText: {
    fontSize: 16,
  },
  actionButtons: {
    gap: 12,
  },
  acceptButton: {
    marginBottom: 8,
  },
  declineButton: {},
  creatorMessage: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  creatorText: {
    color: '#2563EB',
    textAlign: 'center',
    fontSize: 14,
  },
  participatedMessage: {
    backgroundColor: '#ECFDF5',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  participatedText: {
    color: '#059669',
    textAlign: 'center',
    fontSize: 14,
  },
  unavailableMessage: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  unavailableText: {
    color: '#DC2626',
    textAlign: 'center',
    fontSize: 14,
  },
  viewAllButton: {
    alignSelf: 'center',
  },
  pickDisplayContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pickDisplayTitle: {
    textAlign: 'center',
    marginBottom: 16,
    color: '#1E293B',
  },
  pickComparison: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  pickSide: {
    alignItems: 'center',
    flex: 1,
  },
  pickLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 8,
    textAlign: 'center',
  },
  pickBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  creatorBadge: {
    backgroundColor: '#EF4444',
  },
  acceptorBadge: {
    backgroundColor: '#10B981',
  },
  pickText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
  },
  vsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#64748B',
    marginHorizontal: 16,
  },
});
