import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { useColors, radius, space, elevation } from '../theme';
import { Text } from './Text';
import { Touch } from './Pressable';

/**
 * a surface, at one of three altitudes.
 *
 * the old card had one shadow and a `flat` escape hatch for putting cards
 * inside cards — which is the tell that hierarchy was being expressed by
 * nesting boxes rather than by weight. nothing ever used the hatch, and every
 * surface in the product came out at the same height with the same
 * near-invisible shadow, so a screen read as a stack of white rectangles.
 *
 *   flat   a row resting on the page. no shadow, edge does the work.
 *   card   the default.
 *   hero   the one thing you opened the screen for. at most one per screen.
 *
 * a hero drops the border: a surface lifted that far off the page is described
 * by its shadow, and outlining it as well is the mushy both-at-once that made
 * edges read as neither.
 */
export function Card({
  children,
  style,
  onPress,
  padded = true,
  level = 'card',
}: {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  onPress?: () => void;
  padded?: boolean;
  level?: 'flat' | 'card' | 'hero';
}) {
  const c = useColors();
  const base: ViewStyle[] = [
    {
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      borderWidth: level === 'hero' ? 0 : StyleSheet.hairlineWidth,
      borderColor: c.hairline,
      padding: padded ? space.xl : 0,
      overflow: 'hidden',
    },
    elevation[level] as ViewStyle,
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
