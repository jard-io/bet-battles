import { ScrollView, StyleSheet } from 'react-native';

import { ExternalLink } from '@/components/external-link';
import { ThemedButton } from '@/components/themed-button';
import { ThemedCard } from '@/components/themed-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Collapsible } from '@/components/ui/collapsible';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function TabTwoScreen() {
  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <ThemedView style={styles.headerSection}>
          <IconSymbol
            size={64}
            color="#8B5CF6"
            name="list.bullet"
            style={styles.headerIcon}
          />
          <ThemedText type="title" style={styles.headerTitle}>
            Your Entries
          </ThemedText>
          <ThemedText type="body" style={styles.headerSubtitle}>
            Track your picks and explore the PrizePicks-inspired theme
          </ThemedText>
        </ThemedView>

        {/* Features Section */}
        <ThemedView style={styles.featuresContainer}>
          <ThemedCard variant="elevated" style={styles.featureCard}>
            <ThemedView style={styles.cardHeader}>
              <IconSymbol size={32} color="#8B5CF6" name="paintbrush.fill" />
              <ThemedText type="subtitle" style={styles.cardTitle}>
                Theme System
              </ThemedText>
            </ThemedView>
            <Collapsible title="PrizePicks Color Palette">
              <ThemedText type="body" style={styles.collapsibleText}>
                • Primary Purple: <ThemedText type="defaultSemiBold">#8B5CF6</ThemedText>
              </ThemedText>
              <ThemedText type="body" style={styles.collapsibleText}>
                • Secondary Indigo: <ThemedText type="defaultSemiBold">#6366F1</ThemedText>
              </ThemedText>
              <ThemedText type="body" style={styles.collapsibleText}>
                • Accent Pink: <ThemedText type="defaultSemiBold">#EC4899</ThemedText>
              </ThemedText>
              <ThemedText type="body" style={styles.collapsibleText}>
                • Dark Background: <ThemedText type="defaultSemiBold">#0F0F23</ThemedText>
              </ThemedText>
              <ExternalLink href="https://docs.expo.dev/guides/color-schemes/">
                <ThemedText type="link">Learn about color schemes</ThemedText>
              </ExternalLink>
            </Collapsible>
          </ThemedCard>

          <ThemedCard variant="elevated" style={styles.featureCard}>
            <ThemedView style={styles.cardHeader}>
              <IconSymbol size={32} color="#6366F1" name="square.stack.3d.up.fill" />
              <ThemedText type="subtitle" style={styles.cardTitle}>
                Component Library
              </ThemedText>
            </ThemedView>
            <Collapsible title="Available Components">
              <ThemedText type="body" style={styles.collapsibleText}>
                • <ThemedText type="defaultSemiBold">ThemedButton</ThemedText> - Multiple variants (primary, secondary, outline, ghost)
              </ThemedText>
              <ThemedText type="body" style={styles.collapsibleText}>
                • <ThemedText type="defaultSemiBold">ThemedCard</ThemedText> - Elevated, outlined, and default styles
              </ThemedText>
              <ThemedText type="body" style={styles.collapsibleText}>
                • <ThemedText type="defaultSemiBold">ThemedText</ThemedText> - Hero, title, subtitle, body, caption types
              </ThemedText>
              <ThemedText type="body" style={styles.collapsibleText}>
                • <ThemedText type="defaultSemiBold">ThemedView</ThemedText> - Automatic theme-aware backgrounds
              </ThemedText>
            </Collapsible>
          </ThemedCard>

          <ThemedCard variant="outlined" style={styles.featureCard}>
            <ThemedView style={styles.cardHeader}>
              <IconSymbol size={32} color="#EC4899" name="iphone" />
              <ThemedText type="subtitle" style={styles.cardTitle}>
                Cross Platform
              </ThemedText>
            </ThemedView>
            <Collapsible title="Platform Support">
              <ThemedText type="body" style={styles.collapsibleText}>
                This PrizePicks-inspired theme works seamlessly across:
              </ThemedText>
              <ThemedText type="body" style={styles.collapsibleText}>
                • iOS with native haptic feedback
              </ThemedText>
              <ThemedText type="body" style={styles.collapsibleText}>
                • Android with material design principles
              </ThemedText>
              <ThemedText type="body" style={styles.collapsibleText}>
                • Web with responsive design
              </ThemedText>
            </Collapsible>
          </ThemedCard>

          <ThemedCard variant="elevated" style={styles.featureCard}>
            <ThemedView style={styles.cardHeader}>
              <IconSymbol size={32} color="#10B981" name="wand.and.stars" />
              <ThemedText type="subtitle" style={styles.cardTitle}>
                Modern Features
              </ThemedText>
            </ThemedView>
            <Collapsible title="What's Included">
              <ThemedText type="body" style={styles.collapsibleText}>
                • Smooth animations with react-native-reanimated
              </ThemedText>
              <ThemedText type="body" style={styles.collapsibleText}>
                • Haptic feedback for enhanced UX
              </ThemedText>
              <ThemedText type="body" style={styles.collapsibleText}>
                • File-based routing with Expo Router
              </ThemedText>
              <ThemedText type="body" style={styles.collapsibleText}>
                • TypeScript support throughout
              </ThemedText>
              <ExternalLink href="https://docs.swmansion.com/react-native-reanimated/">
                <ThemedText type="link">Learn about animations</ThemedText>
              </ExternalLink>
            </Collapsible>
          </ThemedCard>
        </ThemedView>

        {/* Action Section */}
        <ThemedView style={styles.actionSection}>
          <ThemedText type="subtitle" style={styles.actionTitle}>
            Ready to Build?
          </ThemedText>
          <ThemedText type="body" style={styles.actionDescription}>
            Start customizing your app with the PrizePicks-inspired design system.
          </ThemedText>
          <ThemedView style={styles.buttonRow}>
            <ThemedButton 
              title="View Source" 
              variant="outline" 
              size="medium"
              style={styles.actionButton}
              onPress={() => alert('Check the components folder!')}
            />
            <ThemedButton 
              title="Get Started" 
              variant="primary" 
              size="medium"
              style={styles.actionButton}
              onPress={() => alert('Happy coding!')}
            />
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
  scrollView: {
    flex: 1,
  },
  headerSection: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 32,
    alignItems: 'center',
  },
  headerIcon: {
    marginBottom: 16,
  },
  headerTitle: {
    textAlign: 'center',
    marginBottom: 12,
  },
  headerSubtitle: {
    textAlign: 'center',
    opacity: 0.8,
    maxWidth: 300,
  },
  featuresContainer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  featureCard: {
    marginVertical: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  cardTitle: {
    flex: 1,
  },
  collapsibleText: {
    marginBottom: 8,
    lineHeight: 20,
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
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    maxWidth: 300,
  },
  actionButton: {
    flex: 1,
  },
});