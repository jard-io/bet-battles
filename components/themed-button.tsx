import { useThemeColor } from '@/hooks/use-theme-color';
import { Pressable, StyleSheet, type PressableProps } from 'react-native';
import { ThemedText } from './themed-text';

export type ThemedButtonProps = PressableProps & {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  lightColor?: string;
  darkColor?: string;
  textLightColor?: string;
  textDarkColor?: string;
};

export function ThemedButton({
  title,
  variant = 'primary',
  size = 'medium',
  style,
  lightColor,
  darkColor,
  textLightColor,
  textDarkColor,
  disabled,
  ...otherProps
}: ThemedButtonProps) {
  const primaryColor = useThemeColor({ light: lightColor, dark: darkColor }, 'primary');
  const secondaryColor = useThemeColor({}, 'secondary');
  const borderColor = useThemeColor({}, 'border');
  const backgroundColor = useThemeColor({}, 'background');
  
  const textColor = useThemeColor(
    { light: textLightColor, dark: textDarkColor }, 
    variant === 'primary' ? 'background' : 'text'
  );

  const getBackgroundColor = () => {
    if (disabled) return useThemeColor({}, 'border');
    
    switch (variant) {
      case 'primary':
        return primaryColor;
      case 'secondary':
        return secondaryColor;
      case 'outline':
      case 'ghost':
        return 'transparent';
      default:
        return primaryColor;
    }
  };

  const getBorderColor = () => {
    switch (variant) {
      case 'outline':
        return primaryColor;
      default:
        return 'transparent';
    }
  };

  const sizeStyles = {
    small: styles.small,
    medium: styles.medium,
    large: styles.large,
  };

  const variantStyles = {
    primary: styles.primary,
    secondary: styles.secondary,
    outline: [styles.outline, { borderColor: getBorderColor() }],
    ghost: styles.ghost,
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        sizeStyles[size],
        variantStyles[variant],
        { backgroundColor: getBackgroundColor() },
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
      disabled={disabled}
      {...otherProps}
    >
      <ThemedText 
        type="button" 
        style={[
          { color: disabled ? useThemeColor({}, 'icon') : textColor },
          variant === 'ghost' && { color: primaryColor }
        ]}
      >
        {title}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
  },
  small: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 32,
  },
  medium: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 44,
  },
  large: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    minHeight: 52,
  },
  primary: {},
  secondary: {},
  outline: {
    borderWidth: 1,
  },
  ghost: {},
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.5,
  },
});
