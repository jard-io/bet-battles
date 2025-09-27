import { isAuthenticated } from '@/utils/authStorage';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const [isChecking, setIsChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  const checkAuth = useCallback(async () => {
    try {
      setIsChecking(true);
      const userIsAuthenticated = await isAuthenticated();
      console.log('Auth check result:', userIsAuthenticated);
      setAuthenticated(userIsAuthenticated);
      
      if (!userIsAuthenticated) {
        console.log('User not authenticated, redirecting to auth');
        router.replace('/auth');
      } else {
        console.log('User is authenticated, showing tabs');
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setAuthenticated(false);
      router.replace('/auth');
    } finally {
      setIsChecking(false);
    }
  }, []);

  // Check auth every time the screen comes into focus
  useFocusEffect(checkAuth);

  if (isChecking) {
    return null; // Could add a loading spinner here
  }

  if (!authenticated) {
    return null; // Will redirect to auth screen
  }

  return <>{children}</>;
}
