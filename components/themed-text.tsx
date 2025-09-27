import { StyleSheet, Text, type TextProps } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link' | 'hero' | 'body' | 'caption' | 'button' | 'overline';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return (
    <Text
      style={[
        { color },
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? styles.link : undefined,
        type === 'hero' ? styles.hero : undefined,
        type === 'body' ? styles.body : undefined,
        type === 'caption' ? styles.caption : undefined,
        type === 'button' ? styles.button : undefined,
        type === 'overline' ? styles.overline : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 26,
    letterSpacing: -0.2,
  },
  hero: {
    fontSize: 36,
    fontWeight: '800',
    lineHeight: 42,
    letterSpacing: -1,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
    opacity: 0.7,
  },
  button: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
    textAlign: 'center',
  },
  overline: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  link: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
    color: '#8B5CF6',
  },
});
