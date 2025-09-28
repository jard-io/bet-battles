/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

// PrizePicks inspired color palette
const tintColorLight = '#8B5CF6'; // Purple primary
const tintColorDark = '#A855F7'; // Lighter purple for dark mode

export const Colors = {
  light: {
    text: '#1A1A1A',
    background: '#FFFFFF',
    tint: tintColorLight,
    icon: '#6B7280',
    tabIconDefault: '#9CA3AF',
    tabIconSelected: tintColorLight,
    // PrizePicks specific colors
    primary: '#8B5CF6', // Main purple
    secondary: '#6366F1', // Indigo accent
    accent: '#EC4899', // Pink accent
    surface: '#F8FAFC', // Light surface
    surfaceSecondary: '#F1F5F9', // Secondary surface
    border: 'rgba(139, 92, 246, 0.15)',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    cardBackground: '#F8FAFC',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
  dark: {
    text: '#F8FAFC',
    background: '#0b0b1c', // Deep purple-black
    tint: tintColorDark,
    icon: '#9CA3AF',
    tabIconDefault: '#6B7280',
    tabIconSelected: tintColorDark,
    // PrizePicks specific colors
    primary: '#A855F7', // Lighter purple for dark
    secondary: '#7C3AED', // Dark mode indigo
    accent: '#F472B6', // Light pink accent
    surface: '#1E1B3A', // Dark purple surface
    surfaceSecondary: '#2D1B69', // Darker purple surface
    border: 'rgba(168, 85, 247, 0.25)',
    success: '#34D399',
    warning: '#FBBF24',
    error: '#F87171',
    cardBackground: '#252140',
    overlay: 'rgba(0, 0, 0, 0.7)',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
