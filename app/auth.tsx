import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, TextInput } from 'react-native';

import { ThemedButton } from '@/components/themed-button';
import { ThemedCard } from '@/components/themed-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

const AUTH_STORAGE_KEY = 'user_auth_token';
const USER_STORAGE_KEY = 'user_data';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!isLogin && !email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }

    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const body = isLogin 
        ? { username, password }
        : { username, email, password };

      console.log('Making auth request to:', `http://localhost:3000${endpoint}`);
      console.log('Request body:', body);

      const response = await fetch(`http://localhost:3000${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        throw new Error(data.message || `Server error: ${response.status}`);
      }

      // Store authentication token and user data
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, data.token);
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));

      console.log('Auth successful, redirecting to tabs');
      
      // Navigate immediately, no alert needed
      router.replace('/(tabs)');

    } catch (error) {
      console.error('Auth error:', error);
      
      let errorMessage = 'Authentication failed';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      Alert.alert('Error', `Failed to ${isLogin ? 'sign in' : 'create account'}: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestAccess = async () => {
    try {
      // Create a temporary guest user
      const guestUsername = `guest_${Date.now()}`;
      const response = await fetch('http://localhost:3000/api/auth/guest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: guestUsername }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Guest access failed');
      }

      // Store guest token and user data
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, data.token);
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));

      console.log('Guest auth successful, redirecting to tabs');
      router.replace('/(tabs)');

    } catch (error) {
      console.error('Guest access error:', error);
      Alert.alert('Error', 'Failed to create guest account');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ThemedView style={styles.content}>
        <ThemedText type="title" style={styles.title}>
          {isLogin ? 'Welcome Back!' : 'Create Account'}
        </ThemedText>
        
        <ThemedText type="subtitle" style={styles.subtitle}>
          {isLogin ? 'Sign in to continue' : 'Join the betting community'}
        </ThemedText>

        <ThemedCard style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder={isLogin ? "Username or Email" : "Username"}
            placeholderTextColor="#666"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
          />

          {!isLogin && (
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#666"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
            />
          )}

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#666"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />

          <ThemedButton 
            title={loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
            onPress={handleAuth}
            disabled={loading}
            style={styles.authButton}
          />

          <ThemedButton 
            title={isLogin ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
            onPress={() => setIsLogin(!isLogin)}
            variant="secondary"
            style={styles.switchButton}
          />

          <ThemedButton 
            title="Continue as Guest"
            onPress={handleGuestAccess}
            variant="ghost"
            style={styles.guestButton}
          />
        </ThemedCard>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 10,
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 30,
    opacity: 0.7,
  },
  form: {
    padding: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#333',
  },
  authButton: {
    marginBottom: 12,
  },
  switchButton: {
    marginBottom: 8,
  },
  guestButton: {
    opacity: 0.7,
  },
});
