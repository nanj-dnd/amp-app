import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../../ui/Text';
import { Touch } from '../../ui/Pressable';
import { Sheet } from '../../ui/Sheet';
import { useColors, space, radius, font } from '../../theme';

export type PickOption = { id: string; label: string; meta?: string };

/** the one modal the scorer sees: pick a person, or a way of getting out. */
export function PickSheet({
  title,
  subtitle,
  options,
  onPick,
  onClose,
  extraAction,
}: {
  title: string;
  subtitle?: string;
  options: PickOption[];
  onPick: (id: string) => void;
  onClose: () => void;
  extraAction?: { label: string; id: string };
}) {
  const c = useColors();

  return (
    <Sheet onClose={onClose} scroll>
      <View style={{ paddingVertical: space.md, gap: 2 }}>
        <Text variant="heading">{title}</Text>
        {subtitle && (
          <Text variant="caption" tone="secondary">
            {subtitle}
          </Text>
        )}
      </View>

      <View style={{ gap: space.sm }}>
        {options.length === 0 && (
          <Text variant="callout" tone="tertiary" align="center" style={{ paddingVertical: space.xl }}>
            nobody available
          </Text>
        )}

        {options.map((o) => (
          <Touch
            key={o.id}
            haptic="selection"
            onPress={() => onPick(o.id)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: space.md,
              minHeight: 52,
              paddingHorizontal: space.lg,
              borderRadius: radius.md,
              backgroundColor: c.fill,
            }}
          >
            <Text variant="bodyStrong" style={{ flex: 1 }} numberOfLines={1}>
              {o.label}
            </Text>
            {o.meta && (
              <Text variant="caption" tone="tertiary" style={{ fontFamily: font.bold }}>
                {o.meta}
              </Text>
            )}
            <Ionicons name="chevron-forward" size={15} color={c.textTertiary} />
          </Touch>
        ))}

        {extraAction && (
          <Touch
            haptic="selection"
            onPress={() => onPick(extraAction.id)}
            style={{
              minHeight: 52,
              justifyContent: 'center',
              paddingHorizontal: space.lg,
              borderRadius: radius.md,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: c.brandBorder,
              backgroundColor: c.brandTint,
            }}
          >
            <Text variant="callout" tone="brand">
              {extraAction.label}
            </Text>
          </Touch>
        )}
      </View>
    </Sheet>
  );
}
