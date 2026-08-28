import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors, space, radius, METALS } from '../../theme';
import { Text } from '../../ui/Text';
import { Touch } from '../../ui/Pressable';
import { MetalFill } from '../../ui/Metal';

/** big single-choice row. 56pt tall so it's a comfortable thumb target. */
export function OptionRow({
  label,
  sub,
  selected,
  onPress,
  glyph,
}: {
  label: string;
  sub?: string;
  selected: boolean;
  onPress: () => void;
  /** render fn so the glyph can take the right colour for its state */
  glyph?: (color: string) => React.ReactNode;
}) {
  const c = useColors();
  return (
    <Touch
      haptic="selection"
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.md,
        minHeight: 56,
        paddingHorizontal: space.lg,
        paddingVertical: space.md,
        borderRadius: radius.md,
        backgroundColor: selected ? c.brandTint : c.surface,
        borderWidth: 1.5,
        borderColor: selected ? c.brand : c.hairline,
      }}
    >
      {glyph && (
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: selected ? METALS.brand.base : c.fill,
            overflow: 'hidden',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {selected && <MetalFill metal="brand" />}
          {glyph(selected ? METALS.brand.ink : c.textSecondary)}
        </View>
      )}
      <View style={{ flex: 1, gap: 1 }}>
        <Text variant="bodyStrong" tone={selected ? 'brand' : 'primary'}>
          {label}
        </Text>
        {sub && (
          <Text variant="caption" tone="secondary">
            {sub}
          </Text>
        )}
      </View>
      {selected && <Ionicons name="checkmark-circle" size={21} color={c.brand} />}
    </Touch>
  );
}

/** wrapping pill row for the short enumerations (level, order, speciality). */
export function Choice<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const c = useColors();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Touch
            key={o.value}
            haptic="selection"
            onPress={() => onChange(o.value)}
            style={{
              paddingHorizontal: space.lg,
              height: 38,
              borderRadius: radius.pill,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: on ? METALS.brand.base : c.fill,
              overflow: 'hidden',
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: 'transparent',
            }}
          >
            {on && <MetalFill metal="brand" />}
            <Text variant="callout" color={on ? METALS.brand.ink : c.textSecondary}>
              {o.label}
            </Text>
          </Touch>
        );
      })}
    </View>
  );
}
