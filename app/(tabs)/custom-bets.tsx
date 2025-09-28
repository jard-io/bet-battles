import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Clipboard, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { ThemedButton } from '@/components/themed-button';
import { ThemedCard } from '@/components/themed-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { logout } from '@/utils/authStorage';

interface CustomBet {
  id: string;
  player: string;
  stat: string;
  line: number;
  creator: string;
  creatorId: string;
  creatorUsername: string;
  creatorPickType?: 'OVER' | 'UNDER';
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'COMPLETED';
  outcome?: 'WIN' | 'LOSS' | 'TBD';
  participants: any[];
  userPick?: 'OVER' | 'UNDER';
  userOutcome?: 'WIN' | 'LOSS' | 'TBD';
  shareableLink?: string;
  createdAt?: string;
  acceptedAt?: string;
  completedAt?: string;
}

export default function CustomBetsScreen() {
  const [player, setPlayer] = useState('');
  const [stat, setStat] = useState('');
  const [line, setLine] = useState('');
  const [pickType, setPickType] = useState<'OVER' | 'UNDER'>('OVER');
  const [customBets, setCustomBets] = useState<CustomBet[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [copiedBetId, setCopiedBetId] = useState<string | null>(null);

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

  // Load current user and custom bets
  useEffect(() => {
    loadCurrentUser();
    loadCustomBets();
  }, []);

  // Refresh custom bets when tab comes into focus (e.g., after accepting a bet)
  useFocusEffect(
    useCallback(() => {
      loadCustomBets();
    }, [])
  );

  const loadCurrentUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('user_data');
      if (userData) {
        setCurrentUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadCustomBets = async () => {
    try {
      setLoading(true);
      const response = await apiCall('/custom-bets');
      
      // Get current user from backend to ensure we have the correct ID
      const authCurrentUser = await apiCall('/auth/profile', { method: 'GET' });
      const currentUserId = authCurrentUser?.user?.id || currentUser?.id;
      
      // Map backend response to frontend format
      const mappedBets = (response.bets || []).map((bet: any) => {
        // Find current user's participation
        const userParticipation = bet.participants?.find((p: any) => p.userId === currentUserId);
        
        // Determine user's pick and outcome from participants table
        let userPick: 'OVER' | 'UNDER' | undefined;
        let userOutcome: 'WIN' | 'LOSS' | 'TBD' | undefined;
        
        if (userParticipation) {
          // User is either creator or participant - both are now in participants table
          userPick = userParticipation.pickType;
          userOutcome = userParticipation.outcome;
        } else if (bet.isCreator) {
          // Fallback for creators not yet in participants table
          userPick = bet.creatorPickType;
          // Calculate outcome based on bet outcome if available
          if (bet.outcome === 'TBD') {
            userOutcome = 'TBD';
          } else if (bet.outcome === 'WIN') {
            userOutcome = bet.creatorPickType === 'OVER' ? 'WIN' : 'LOSS';
          } else if (bet.outcome === 'LOSS') {
            userOutcome = bet.creatorPickType === 'UNDER' ? 'WIN' : 'LOSS';
          }
        }
        
        return {
          id: bet.id,
          player: bet.player,
          stat: bet.stat,
          line: bet.line,
          creator: bet.creatorUsername || 'Unknown',
          creatorId: bet.creatorId,
          creatorUsername: bet.creatorUsername,
          creatorPickType: bet.creatorPickType,
          status: bet.status,
          outcome: bet.outcome,
          participants: bet.participants || [],
          userPick,
          userOutcome,
          createdAt: bet.createdAt,
        };
      });
      
      setCustomBets(mappedBets);
    } catch (error) {
      console.error('Error loading custom bets:', error);
      Alert.alert('Error', 'Failed to load custom bets');
    } finally {
      setLoading(false);
    }
  };

  const createCustomBet = async () => {
    if (!player.trim() || !stat.trim() || !line.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const lineNumber = parseFloat(line);
    if (isNaN(lineNumber)) {
      Alert.alert('Error', 'Please enter a valid number for the line');
      return;
    }

    try {
      setLoading(true);
      const response = await apiCall('/custom-bets', {
        method: 'POST',
        body: JSON.stringify({
          player: player.trim(),
          stat: stat.trim(),
          line: lineNumber,
          pickType: pickType,
        }),
      });

      // Clear form
      setPlayer('');
      setStat('');
      setLine('');
      setPickType('OVER');

      // Reload bets
      await loadCustomBets();

      const shareUrl = `http://localhost:8081/bet/${response.bet.id}`;
      Alert.alert(
        'Bet Created!', 
        `Custom bet created successfully!\n\nShare this link with friends to challenge them!`,
        [
          { text: 'OK' },
          { text: 'Share Now', onPress: () => shareBet({ ...response.bet, shareableLink: shareUrl }) }
        ]
      );
    } catch (error) {
      console.error('Error creating custom bet:', error);
      Alert.alert('Error', 'Failed to create custom bet');
    } finally {
      setLoading(false);
    }
  };

  const shareBet = async (bet: CustomBet) => {
    const shareUrl = bet.shareableLink || `http://localhost:8081/bet/${bet.id}`;
    
    try {
      await Clipboard.setString(shareUrl);
      setCopiedBetId(bet.id);
      
      // Hide the message after 2 seconds
      setTimeout(() => {
        setCopiedBetId(null);
      }, 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      Alert.alert('Error', 'Failed to copy link to clipboard');
    }
  };

  const acceptBet = async (betId: string) => {
    try {
      setLoading(true);
      await apiCall(`/custom-bets/${betId}/accept`, {
        method: 'POST',
      });
      
      await loadCustomBets();
      Alert.alert('Bet Accepted!', 'Good luck! Results will be determined randomly.');
    } catch (error) {
      console.error('Error accepting bet:', error);
      Alert.alert('Error', 'Failed to accept bet');
    } finally {
      setLoading(false);
    }
  };

  const declineBet = async (betId: string) => {
    try {
      setLoading(true);
      await apiCall(`/custom-bets/${betId}/decline`, {
        method: 'POST',
      });
      
      await loadCustomBets();
      Alert.alert('Bet Declined', 'You have declined this bet.');
    } catch (error) {
      console.error('Error declining bet:', error);
      Alert.alert('Error', 'Failed to decline bet');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (confirm('Are you sure you want to sign out?')) {
      try {
        const success = await logout();
        if (success) {
          router.replace('/auth');
        } else {
          alert('Failed to sign out. Please try again.');
        }
      } catch (error) {
        console.error('Error during sign out:', error);
        alert('An error occurred during sign out.');
      }
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

  return (
    <ThemedView style={styles.container}>

              <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Content Header */}
                <ThemedView style={styles.headerSection}>
                  {/* BetBattles Logo - positioned absolutely */}
                  <View style={styles.logoContainer}>
                    <Image 
                      source={require('@/assets/images/betbattles-logo.png')} 
                      style={styles.logo}
                      resizeMode="contain"
                    />
                  </View>
                  
                  {/* Sign Out Button - positioned absolutely */}
                  <Pressable
                    onPress={handleSignOut}
                    style={styles.signOutButton}
                  >
                    <Text style={styles.signOutText}>
                      Sign Out
                    </Text>
                  </Pressable>
                  
                  <IconSymbol size={48} name="plus.circle.fill" color="#8B5CF6" style={styles.headerIcon} />
                  <ThemedText type="title" style={styles.contentTitle}>
                    Custom Bets
                  </ThemedText>
          <ThemedText type="body" style={styles.headerSubtitle}>
            Create your own bets and challenge friends
          </ThemedText>
        </ThemedView>

        {/* Create Bet Form */}
        <ThemedView style={styles.createSection}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Create New Bet
          </ThemedText>
          
          <ThemedCard variant="elevated" style={styles.formCard}>
            <ThemedView style={[styles.formField, { backgroundColor: 'transparent' }]}>
              <ThemedText type="body" style={styles.fieldLabel}>
                Player Name
              </ThemedText>
              <TextInput
                style={styles.textInput}
                value={player}
                onChangeText={setPlayer}
                placeholder="e.g., LeBron James"
                placeholderTextColor="#9CA3AF"
              />
            </ThemedView>

            <ThemedView style={[styles.formField, { backgroundColor: 'transparent' }]}>
              <ThemedText type="body" style={styles.fieldLabel}>
                Stat Type
              </ThemedText>
              <TextInput
                style={styles.textInput}
                value={stat}
                onChangeText={setStat}
                placeholder="e.g., Points, Rebounds, Assists"
                placeholderTextColor="#9CA3AF"
              />
            </ThemedView>

            <ThemedView style={[styles.formField, { backgroundColor: 'transparent' }]}>
              <ThemedText type="body" style={styles.fieldLabel}>
                Line
              </ThemedText>
              <TextInput
                style={styles.textInput}
                value={line}
                onChangeText={setLine}
                placeholder="e.g., 25.5"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
              />
            </ThemedView>

            <ThemedView style={[styles.formField, { backgroundColor: 'transparent' }]}>
              <ThemedText type="body" style={styles.fieldLabel}>
                Your Pick
              </ThemedText>
              <ThemedView style={[styles.pickTypeContainer, { backgroundColor: 'transparent' }]}>
                <ThemedButton
                  title="OVER"
                  variant={pickType === 'OVER' ? 'primary' : 'outline'}
                  size="small"
                  style={styles.pickTypeButton}
                  onPress={() => setPickType('OVER')}
                />
                <ThemedButton
                  title="UNDER"
                  variant={pickType === 'UNDER' ? 'primary' : 'outline'}
                  size="small"
                  style={styles.pickTypeButton}
                  onPress={() => setPickType('UNDER')}
                />
              </ThemedView>
              <ThemedText type="body" style={styles.pickTypeHint}>
                The person accepting will automatically get the opposite pick
              </ThemedText>
            </ThemedView>

            <ThemedButton
              title={loading ? "Creating..." : "Create Bet"}
              variant="primary"
              size="large"
              style={styles.createButton}
              onPress={createCustomBet}
              disabled={loading}
            />
          </ThemedCard>
        </ThemedView>

        {/* Active Bets */}
        <ThemedView style={styles.betsSection}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Your Bets
          </ThemedText>

          <ThemedView style={styles.betsContainer}>
            {customBets.map((bet) => (
              <ThemedCard key={bet.id} variant="outlined" style={styles.betCard}>
                <ThemedView style={[styles.betHeader, { backgroundColor: 'transparent' }]}>
                  <ThemedView style={[styles.betInfo, { backgroundColor: 'transparent' }]}>
                    <ThemedText type="subtitle" style={styles.playerName}>
                      {bet.player}
                    </ThemedText>
                    <ThemedText type="body" style={styles.statInfo}>
                      {bet.stat} - {bet.line}
                    </ThemedText>
                    <ThemedText type="body" style={styles.creatorInfo}>
                      Created by: {bet.creator}
                    </ThemedText>
                    {bet.userPick && (
                      <ThemedText type="body" style={styles.userPickInfo}>
                        Your pick: <ThemedText type="defaultSemiBold" style={styles.pickHighlight}>{bet.userPick} {bet.line}</ThemedText>
                      </ThemedText>
                    )}
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

                {(bet.userOutcome || (bet.status === 'ACCEPTED' || bet.status === 'COMPLETED')) && (
                  <ThemedView style={[styles.outcomeContainer, { backgroundColor: 'transparent' }]}>
                    <ThemedText
                      type="defaultSemiBold"
                      style={[
                        styles.outcomeText,
                        { color: bet.userOutcome === 'WIN' ? '#10B981' : bet.userOutcome === 'LOSS' ? '#EF4444' : '#F59E0B' }
                      ]}
                    >
                      {bet.userOutcome === 'WIN' ? '🎉 You Won!' : 
                       bet.userOutcome === 'LOSS' ? '😔 You Lost' : 
                       bet.userOutcome === 'TBD' ? '⏳ Result TBD' : 
                       bet.status === 'ACCEPTED' ? '⏳ Result TBD' : 
                       bet.status === 'COMPLETED' ? '⏳ No Result Available' : ''}
                    </ThemedText>
                  </ThemedView>
                )}

                <ThemedView style={[styles.betActions, { backgroundColor: 'transparent' }]}>
                  {bet.status === 'PENDING' && bet.creatorId !== currentUser?.id && !bet.participants.some(p => p.userId === currentUser?.id) && (
                    <ThemedView style={[styles.actionButtons, { backgroundColor: 'transparent' }]}>
                      <ThemedButton
                        title="Accept"
                        variant="primary"
                        size="small"
                        style={styles.actionButton}
                        onPress={() => acceptBet(bet.id)}
                      />
                      <ThemedButton
                        title="Decline"
                        variant="outline"
                        size="small"
                        style={styles.actionButton}
                        onPress={() => declineBet(bet.id)}
                      />
                    </ThemedView>
                  )}

                  {bet.creatorId === currentUser?.id && (
                    <ThemedButton
                      title={copiedBetId === bet.id ? "✅ Link Copied!" : "Share This Bet"}
                      variant={copiedBetId === bet.id ? "primary" : "outline"}
                      size="small"
                      style={styles.shareButton}
                      onPress={() => shareBet(bet)}
                      disabled={copiedBetId === bet.id}
                    />
                  )}

                </ThemedView>

                {bet.participants.length > 0 && (
                  <ThemedView style={[styles.participantsContainer, { backgroundColor: 'transparent' }]}>
                    <ThemedText type="body" style={styles.participantsLabel}>
                      Participants: {bet.participants.map(p => p.username || p).join(', ')}
                    </ThemedText>
                  </ThemedView>
                )}
              </ThemedCard>
            ))}
          </ThemedView>
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  topHeaderTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  signOutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  scrollView: {
    flex: 1,
  },
  headerSection: {
    position: 'relative',
    paddingHorizontal: 20,
    paddingTop: 60,
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
  headerTitle: {
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    textAlign: 'center',
    opacity: 0.8,
    maxWidth: 300,
  },
  createSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    marginBottom: 16,
    opacity: 0.9,
  },
  formCard: {
    marginVertical: 0,
  },
  formField: {
    marginBottom: 16,
  },
  fieldLabel: {
    marginBottom: 8,
    opacity: 0.8,
    fontWeight: '600',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
    color: '#1F2937',
  },
  pickTypeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  pickTypeButton: {
    flex: 1,
  },
  pickTypeHint: {
    fontSize: 12,
    opacity: 0.7,
    fontStyle: 'italic',
  },
  createButton: {
    marginTop: 8,
  },
  betsSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  betsContainer: {
    gap: 16,
  },
  betCard: {
    marginVertical: 0,
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
  userPickInfo: {
    fontSize: 12,
    opacity: 0.8,
    marginTop: 2,
  },
  pickHighlight: {
    fontWeight: '600',
    opacity: 1,
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  outcomeText: {
    fontSize: 16,
  },
  betActions: {
    marginTop: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  actionButton: {
    flex: 1,
    minHeight: 40,
  },
  shareButton: {
    width: '100%',
    minHeight: 40,
  },
  participantsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  participantsLabel: {
    opacity: 0.7,
    fontSize: 12,
  },
  signOutButton: {
    position: 'absolute',
    top: 10,
    right: 20,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#8B5CF6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  signOutText: {
    color: '#8B5CF6',
    fontWeight: '500',
    fontSize: 14,
  },
});
