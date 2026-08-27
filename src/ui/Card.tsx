import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { useColors, radius, space, elevation } from '../theme';
import { Text } from './Text';
import { Touch } from './Pressable';

export function Card({
  children,
  style,
  onPress,
  padded = true,
  flat = false,
}: {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  onPress?: () => void;
  padded?: boolean;
  /** flat drops the shadow — for cards nested inside another card. */
  flat?: boolean;
}) {
  const c = useColors();
  const base: ViewStyle[] = [
    {
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.hairline,
      padding: padded ? space.xl : 0,
      overflow: 'hidden',
    },
    !flat && (elevation.card as ViewStyle),
    style as ViewStyle,
  ].filter(Boolean) as ViewStyle[];

  if (!onPress) return <View style={base}>{children}</View>;
  return (
    <Touch style={base} onPress={onPress} haptic="selection">
      {children}
    </Touch>
  );
}

/** small tracked label that opens a section inside a card. */
export function Eyebrow({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return (
    <Text variant="eyebrow" tone="tertiary" style={[{ marginBottom: space.md }, style as any]}>
      {children}
    </Text>
  );
}

export function Divider({ inset = 0 }: { inset?: number }) {
  const c = useColors();
  return (
    <View
      style={{
        height: StyleSheet.hairlineWidth,
        backgroundColor: c.hairline,
        marginLeft: inset,
      }}
    />
  );
}
