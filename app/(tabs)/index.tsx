import { ScrollView, StyleSheet } from 'react-native';

import { ThemedButton } from '@/components/themed-button';
import { ThemedCard } from '@/components/themed-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Link } from 'expo-router';

export default function HomeScreen() {
  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <ThemedView style={styles.heroSection}>
          <ThemedText type="overline" style={styles.overlineText}>
            WELCOME TO
          </ThemedText>
          <ThemedText type="hero" style={styles.heroTitle}>
            PrizePicks Style
          </ThemedText>
          <ThemedText type="body" style={styles.heroSubtitle}>
            Experience the sleek, modern design inspired by the PrizePicks app
          </ThemedText>
        </ThemedView>

        {/* Feature Cards */}
        <ThemedView style={styles.cardsContainer}>
          <ThemedCard variant="elevated" style={styles.featureCard}>
            <ThemedText type="overline" style={styles.cardOverline}>
              THEME
            </ThemedText>
            <ThemedText type="subtitle" style={styles.cardTitle}>
              Purple & Black Design
            </ThemedText>
            <ThemedText type="body" style={styles.cardDescription}>
              Clean, modern interface with PrizePicks-inspired color palette featuring purple accents and sophisticated gradients.
            </ThemedText>
            <ThemedButton 
              title="Explore Theme" 
              variant="primary" 
              size="medium"
              style={styles.cardButton}
              onPress={() => alert('Theme explored!')}
            />
          </ThemedCard>

          <ThemedCard variant="elevated" style={styles.featureCard}>
            <ThemedText type="overline" style={styles.cardOverline}>
              COMPONENTS
            </ThemedText>
            <ThemedText type="subtitle" style={styles.cardTitle}>
              Modern UI Elements
            </ThemedText>
            <ThemedText type="body" style={styles.cardDescription}>
              Beautifully crafted buttons, cards, and typography that match the PrizePicks aesthetic.
            </ThemedText>
            <ThemedView style={styles.buttonRow}>
              <ThemedButton 
                title="Primary" 
                variant="primary" 
                size="small"
                style={styles.smallButton}
                onPress={() => alert('Primary button!')}
              />
              <ThemedButton 
                title="Secondary" 
                variant="secondary" 
                size="small"
                style={styles.smallButton}
                onPress={() => alert('Secondary button!')}
              />
              <ThemedButton 
                title="Outline" 
                variant="outline" 
                size="small"
                style={styles.smallButton}
                onPress={() => alert('Outline button!')}
              />
            </ThemedView>
          </ThemedCard>

          <ThemedCard variant="outlined" style={styles.featureCard}>
            <ThemedText type="overline" style={styles.cardOverline}>
              NAVIGATION
            </ThemedText>
            <ThemedText type="subtitle" style={styles.cardTitle}>
              Seamless Experience
            </ThemedText>
            <ThemedText type="body" style={styles.cardDescription}>
              Smooth navigation with haptic feedback and beautiful transitions.
            </ThemedText>
            <Link href="/modal" asChild>
              <ThemedButton 
                title="Open Modal" 
                variant="ghost" 
                size="medium"
                style={styles.cardButton}
              />
            </Link>
          </ThemedCard>
        </ThemedView>

        {/* Action Section */}
        <ThemedView style={styles.actionSection}>
          <ThemedText type="title" style={styles.actionTitle}>
            Ready to Get Started?
          </ThemedText>
          <ThemedText type="body" style={styles.actionDescription}>
            Explore the Explore tab to learn more about what's included in this theme.
          </ThemedText>
          <ThemedButton 
            title="Get Started" 
            variant="primary" 
            size="large"
            style={styles.primaryAction}
            onPress={() => alert('Let\'s go!')}
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
  heroSection: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 32,
    alignItems: 'center',
  },
  overlineText: {
    marginBottom: 8,
    opacity: 0.8,
  },
  heroTitle: {
    textAlign: 'center',
    marginBottom: 16,
  },
  heroSubtitle: {
    textAlign: 'center',
    opacity: 0.8,
    maxWidth: 300,
  },
  cardsContainer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  featureCard: {
    marginVertical: 0,
  },
  cardOverline: {
    marginBottom: 8,
    opacity: 0.7,
  },
  cardTitle: {
    marginBottom: 12,
  },
  cardDescription: {
    marginBottom: 16,
    opacity: 0.8,
    lineHeight: 22,
  },
  cardButton: {
    marginTop: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  smallButton: {
    flex: 1,
    minWidth: 80,
  },
  actionSection: {
    paddingHorizontal: 20,
    paddingVertical: 32,
    alignItems: 'center',
  },
  actionTitle: {
    textAlign: 'center',
    marginBottom: 12,
  },
  actionDescription: {
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.8,
    maxWidth: 280,
  },
  primaryAction: {
    width: '100%',
    maxWidth: 280,
  },
});
