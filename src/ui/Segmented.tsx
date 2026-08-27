import React, { useRef, useEffect, useState } from 'react';
import { View, Animated, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useColors, radius, space, motion, elevation, font } from '../theme';
import { Text } from './Text';

/**
 * ios segmented control: one sliding thumb, springs between slots.
 * replaces the four different toggle styles the old screens each invented.
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  size = 'md',
}: {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  size?: 'sm' | 'md';
}) {
  const c = useColors();
  const [w, setW] = useState(0);
  const idx = Math.max(0, options.findIndex((o) => o.value === value));
  const x = useRef(new Animated.Value(idx)).current;

  useEffect(() => {
    Animated.spring(x, { toValue: idx, useNativeDriver: true, ...motion.spring }).start();
  }, [idx, x]);

  const pad = 3;
  const slot = w > 0 ? (w - pad * 2) / options.length : 0;
  const h = size === 'sm' ? 34 : 42;

  return (
    <View
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
      style={{
        flexDirection: 'row',
        height: h,
        padding: pad,
        borderRadius: radius.md,
        backgroundColor: c.fill,
      }}
    >
      {w > 0 && (
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              top: pad,
              left: pad,
              width: slot,
              height: h - pad * 2,
              borderRadius: radius.md - 3,
              backgroundColor: c.surface,
              transform: [
                { translateX: x.interpolate({ inputRange: [0, 1], outputRange: [0, slot] }) },
              ],
            },
            elevation.card,
          ]}
        />
      )}
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => {
              Haptics.selectionAsync();
              onChange(o.value);
            }}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text
              variant={size === 'sm' ? 'caption' : 'callout'}
              tone={on ? 'primary' : 'secondary'}
              style={{ fontFamily: on ? font.bold : font.medium }}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** single-select pill row — age categories, bowling type, filters. */
export function ChipGroup<T extends string>({
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
          <Pressable
            key={o.value}
            onPress={() => {
              Haptics.selectionAsync();
              onChange(o.value);
            }}
            style={{
              paddingHorizontal: space.lg,
              height: 36,
              borderRadius: radius.pill,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: on ? c.brand : c.fill,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: on ? c.brand : 'transparent',
            }}
          >
            <Text variant="callout" tone={on ? 'onBrand' : 'secondary'}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
