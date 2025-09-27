import { useThemeColor } from '@/hooks/use-theme-color';
import { StyleSheet, type ViewProps } from 'react-native';
import { ThemedView } from './themed-view';

export type ThemedCardProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  variant?: 'default' | 'elevated' | 'outlined';
};

export function ThemedCard({ 
  style, 
  lightColor, 
  darkColor, 
  variant = 'default',
  ...otherProps 
}: ThemedCardProps) {
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'cardBackground');
  const borderColor = useThemeColor({}, 'border');

  const variantStyles = {
    default: styles.default,
    elevated: styles.elevated,
    outlined: [styles.outlined, { borderColor }],
  };

  return (
    <ThemedView 
      style={[
        { backgroundColor },
        variantStyles[variant],
        style
      ]} 
      {...otherProps} 
    />
  );
}

const styles = StyleSheet.create({
  default: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 4,
  },
  elevated: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  outlined: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 4,
    borderWidth: 1,
  },
});
