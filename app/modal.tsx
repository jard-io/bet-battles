import { Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet } from 'react-native';

import { ThemedButton } from '@/components/themed-button';
import { ThemedCard } from '@/components/themed-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function ModalScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <IconSymbol size={48} color="#8B5CF6" name="star.fill" />
        <ThemedText type="title" style={styles.title}>
          Modal Example
        </ThemedText>
        <ThemedText type="body" style={styles.subtitle}>
          This modal showcases the PrizePicks-inspired theme
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.content}>
        <ThemedCard variant="elevated" style={styles.card}>
          <ThemedText type="subtitle" style={styles.cardTitle}>
            Beautiful Modals
          </ThemedText>
          <ThemedText type="body" style={styles.cardText}>
            Modals in the PrizePicks style feature clean layouts, smooth animations, and consistent theming across light and dark modes.
          </ThemedText>
          <ThemedButton 
            title="Primary Action" 
            variant="primary" 
            size="medium"
            style={styles.button}
            onPress={() => alert('Primary action triggered!')}
          />
        </ThemedCard>

        <ThemedCard variant="outlined" style={styles.card}>
          <ThemedText type="subtitle" style={styles.cardTitle}>
            Responsive Design
          </ThemedText>
          <ThemedText type="body" style={styles.cardText}>
            The theme adapts beautifully to different screen sizes and orientations, maintaining the sleek PrizePicks aesthetic.
          </ThemedText>
          <ThemedButton 
            title="Secondary Action" 
            variant="outline" 
            size="medium"
            style={styles.button}
            onPress={() => alert('Secondary action triggered!')}
          />
        </ThemedCard>

        <Link href="/" dismissTo style={styles.linkContainer}>
          <ThemedButton 
            title="Go to Home Screen" 
            variant="ghost" 
            size="large"
            style={styles.linkButton}
          />
        </Link>
      </ThemedView>

      {/* Use a light status bar on iOS to account for the black space above the modal */}
      <StatusBar style={Platform.select({ ios: 'light', default: 'auto' })} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    paddingBottom: 32,
  },
  title: {
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.8,
    maxWidth: 280,
  },
  content: {
    flex: 1,
    gap: 16,
  },
  card: {
    marginVertical: 0,
  },
  cardTitle: {
    marginBottom: 12,
  },
  cardText: {
    marginBottom: 16,
    opacity: 0.8,
    lineHeight: 22,
  },
  button: {
    marginTop: 8,
  },
  linkContainer: {
    marginTop: 20,
    alignSelf: 'stretch',
  },
  linkButton: {
    width: '100%',
  },
});