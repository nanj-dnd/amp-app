import React, { useEffect, useRef } from 'react';
import { View, Animated, Pressable, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors, radius, space, motion, elevation } from '../theme';
import { Text } from './Text';
import { CAN_BLUR, BLUR_INTENSITY } from './chrome';

export const TAB_BAR_HEIGHT = 58;
export const TAB_BAR_SPACE = TAB_BAR_HEIGHT + space.lg; // what screens must pad past

export type TabKey = 'road' | 'iq' | 'add' | 'progress' | 'you';

type Item = {
  key: TabKey;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
  /** the centre item is an action, not a destination — it gets the green disc. */
  action?: boolean;
};

/**
 *   road      the weekly plan — home
 *   game iq   daily, the open-rate driver
 *   [+]       an action, not a destination: film / score a match / log a workout
 *   progress  the amp score and where it's going
 *   you       profile, goal, gym, nutrition, settings
 *
 * gym lost its tab to progress. it is still one tap away — from this week's
 * checklist on the road, from the [+], and from you — and it is used twice a
 * week where progress is checked after every report.
 */
export const TABS: Item[] = [
  { key: 'road', label: 'road', icon: 'map-outline', iconActive: 'map' },
  { key: 'iq', label: 'game iq', icon: 'extension-puzzle-outline', iconActive: 'extension-puzzle' },
  { key: 'add', label: 'add', icon: 'add', iconActive: 'add', action: true },
  { key: 'progress', label: 'progress', icon: 'trending-up-outline', iconActive: 'trending-up' },
  { key: 'you', label: 'you', icon: 'person-outline', iconActive: 'person' },
];

export function TabBar({ active, onChange }: { active: TabKey; onChange: (k: TabKey) => void }) {
  const c = useColors();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        position: 'absolute',
        left: space.gutter,
        right: space.gutter,
        bottom: Math.max(insets.bottom, space.md),
      }}
      pointerEvents="box-none"
    >
      <View style={[{ borderRadius: radius.xl, overflow: 'hidden' }, elevation.raised]}>
        <BlurView
          intensity={BLUR_INTENSITY}
          tint={c.scheme === 'dark' ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: CAN_BLUR ? c.scrim : c.surface,
              borderRadius: radius.xl,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: c.hairline,
            },
          ]}
        />
        <View
          style={{
            height: TAB_BAR_HEIGHT,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: space.xs,
          }}
        >
          {TABS.map((t) => (
            <Tab key={t.key} item={t} active={active === t.key} onPress={() => onChange(t.key)} />
          ))}
        </View>
      </View>
    </View>
  );
}

function Tab({ item, active, onPress }: { item: Item; active: boolean; onPress: () => void }) {
  const c = useColors();
  const s = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!active) return;
    Animated.sequence([
      Animated.spring(s, { toValue: 1.14, useNativeDriver: true, ...motion.spring }),
      Animated.spring(s, { toValue: 1, useNativeDriver: true, ...motion.spring }),
    ]).start();
  }, [active, s]);

  const tint = active ? c.brand : c.textTertiary;

  if (item.action) {
    return (
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onPress();
        }}
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
      >
        <Animated.View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: active ? c.brandPressed : c.brand,
            alignItems: 'center',
            justifyContent: 'center',
            transform: [{ scale: s }],
          }}
        >
          <Ionicons name="add" size={26} color={c.textOnBrand} />
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityLabel={item.label}
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
    >
      {/* icons only — five labels at 10px was five words nobody read, and the
          active tint already says where you are. the label survives for
          screen readers. */}
      <Animated.View style={{ transform: [{ scale: s }] }}>
        <Ionicons name={active ? item.iconActive : item.icon} size={24} color={tint} />
      </Animated.View>
      {active && (
        <View style={{ position: 'absolute', bottom: 8, width: 4, height: 4, borderRadius: 2, backgroundColor: tint }} />
      )}
    </Pressable>
  );
}
