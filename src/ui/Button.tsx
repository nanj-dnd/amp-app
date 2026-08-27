import React from 'react';
import { View, StyleSheet, ActivityIndicator, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors, radius, space } from '../theme';
import { Text } from './Text';
import { Touch } from './Pressable';

type Kind = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const HEIGHT: Record<Size, number> = { sm: 34, md: 44, lg: 52 };

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

  const skin: Record<Kind, { bg: string; fg: string; border: string }> = {
    primary: { bg: c.brand, fg: c.textOnBrand, border: 'transparent' },
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
          gap: space.sm,
          alignSelf: full ? 'stretch' : 'flex-start',
          opacity: off ? 0.45 : 1,
        },
        style as ViewStyle,
      ]}
    >
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
  size = 38,
  disabled,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  kind?: 'primary' | 'secondary';
  size?: number;
  disabled?: boolean;
}) {
  const c = useColors();
  const bg = kind === 'primary' ? c.brand : c.fill;
  const fg = kind === 'primary' ? c.textOnBrand : c.text;
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
      }}
    >
      <View>
        <Ionicons name={icon} size={size * 0.46} color={fg} />
      </View>
    </Touch>
  );
}
