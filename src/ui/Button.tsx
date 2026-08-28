import React from 'react';
import { View, StyleSheet, ActivityIndicator, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors, radius, space, METALS } from '../theme';
import { Text } from './Text';
import { Touch } from './Pressable';
import { MetalFill } from './Metal';

type Kind = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

// 44 is the ios minimum tap target, so md and lg clear it and sm is only ever
// used inline beside text where the whole row is the target.
const HEIGHT: Record<Size, number> = { sm: 36, md: 46, lg: 54 };

export function Button({
  label,
  onPress,
  kind = 'primary',
  size = 'md',
  icon,
  loading,
  disabled,
  full,
  style,
}: {
  label: string;
  onPress?: () => void;
  kind?: Kind;
  size?: Size;
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  full?: boolean;
  style?: ViewStyle;
}) {
  const c = useColors();

  // primary is the one solid colour in the set, so it is the one that gets
  // struck rather than filled. its label is the metal's ink, not white.
  const metal = kind === 'primary';

  const skin: Record<Kind, { bg: string; fg: string; border: string }> = {
    primary: { bg: METALS.brand.base, fg: METALS.brand.ink, border: 'transparent' },
    secondary: { bg: c.surface, fg: c.text, border: c.hairline },
    ghost: { bg: 'transparent', fg: c.brand, border: 'transparent' },
    danger: { bg: c.dangerTint, fg: c.danger, border: 'transparent' },
  };
  const s = skin[kind];
  const off = disabled || loading;

  return (
    <Touch
      onPress={onPress}
      disabled={off}
      haptic={kind === 'danger' ? 'medium' : 'light'}
      style={[
        {
          height: HEIGHT[size],
          paddingHorizontal: size === 'sm' ? space.lg : space.xxl,
          borderRadius: radius.pill,
          backgroundColor: s.bg,
          borderWidth: s.border === 'transparent' ? 0 : StyleSheet.hairlineWidth,
          borderColor: s.border,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: size === 'sm' ? space.sm : space.md,
          alignSelf: full ? 'stretch' : 'flex-start',
          opacity: off ? 0.45 : 1,
          overflow: 'hidden',
        },
        style as ViewStyle,
      ]}
    >
      {metal && <MetalFill metal="brand" />}
      {loading ? (
        <ActivityIndicator size="small" color={s.fg} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={size === 'sm' ? 15 : 17} color={s.fg} />}
          <Text variant={size === 'sm' ? 'caption' : 'bodyStrong'} color={s.fg}>
            {label}
          </Text>
        </>
      )}
    </Touch>
  );
}

/** the round icon-only button used in headers and the composer. */
export function IconButton({
  icon,
  onPress,
  kind = 'secondary',
  size = 40,
  disabled,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  kind?: 'primary' | 'secondary';
  size?: number;
  disabled?: boolean;
}) {
  const c = useColors();
  const metal = kind === 'primary';
  const bg = metal ? METALS.brand.base : c.fill;
  const fg = metal ? METALS.brand.ink : c.text;
  return (
    <Touch
      onPress={onPress}
      disabled={disabled}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.4 : 1,
        overflow: 'hidden',
      }}
    >
      {metal && <MetalFill metal="brand" />}
      <View>
        <Ionicons name={icon} size={size * 0.46} color={fg} />
      </View>
    </Touch>
  );
}
