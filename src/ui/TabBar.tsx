import React, { useRef } from 'react';
import { View, Animated, Pressable, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors, radius, space, elevation, METALS, springConfig, useReduceMotion } from '../theme';
import { Text } from './Text';
import { MetalFill } from './Metal';
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

  // how far the pill floats off the bottom of the screen. on a device with a
  // home indicator that is 34pt; in the browser it is 12.
  const lift = Math.max(insets.bottom, space.md);

  return (
    <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }} pointerEvents="box-none">
      {/*
        the strip the pill floats above.

        the bar is deliberately translucent and content is meant to pass under
        it — but under it is not the same as *below* it. on a device the pill
        sits 34pt off the bottom edge, and that gap was a window: scrolling
        content reappeared beneath the bar and got sliced off by the screen,
        leaving an orphaned half-row under the tab bar. the browser never showed
        it because there is no home indicator there and the gap is 12pt.

        so the gap gets filled with the page's own background. where the page is
        empty it is invisible; where content is passing it reads as the pill
        resting on a ledge. it is sized from the inset, so it is correct on a
        device with a home indicator, one without, and the web.
      */}
      <View
        pointerEvents="none"
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: lift, backgroundColor: c.bg }}
      />

      <View
        style={{ marginHorizontal: space.gutter, marginBottom: lift }}
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
    </View>
  );
}

/**
 * the destination tabs do not animate, and that is deliberate.
 *
 * this is the most-tapped control in the app — core navigation, reached dozens
 * of times a day — and at that frequency motion stops reading as responsiveness
 * and starts reading as lag. it is the same reason raycast opens with no
 * animation. the feedback is still there, it is just instant: the glyph fills,
 * the tint goes brand, and a selection haptic fires under your finger. there is
 * nothing here you can out-tap.
 */
function Tab({ item, active, onPress }: { item: Item; active: boolean; onPress: () => void }) {
  const c = useColors();
  const tint = active ? c.brand : c.textTertiary;

  if (item.action) return <ActionTab onPress={onPress} active={active} />;

  return (
    <Pressable
      accessibilityLabel={item.label}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      onPressIn={Haptics.selectionAsync}
      onPress={onPress}
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
    >
      {/* icons only — five labels at 10px was five words nobody read, and the
          active tint already says where you are. the label survives for
          screen readers.

          the filled glyph and the brand tint already say which tab you are on;
          a dot underneath was a third way of saying it, and the only one that
          added a shape to the bar. */}
      <Ionicons name={active ? item.iconActive : item.icon} size={24} color={tint} />
    </Pressable>
  );
}

/**
 * the [+] is the exception, and it is not a destination — it is an action you
 * take a few times a week. so it keeps a real press: it shrinks the moment you
 * touch it, before the sheet exists, and springs back through an under-damped
 * release, so the overshoot is the recoil of the press you made rather than a
 * flourish played at you afterwards.
 */
function ActionTab({ active, onPress }: { active: boolean; onPress: () => void }) {
  const reduce = useReduceMotion();
  const s = useRef(new Animated.Value(1)).current;

  return (
    <Pressable
      accessibilityLabel="add"
      onPressIn={() => {
        if (!reduce) Animated.spring(s, { toValue: 0.9, ...springConfig('press') }).start();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }}
      onPressOut={() => {
        if (!reduce) Animated.spring(s, { toValue: 1, ...springConfig('flick') }).start();
      }}
      onPress={onPress}
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
    >
      <Animated.View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: active ? METALS.brand.deep : METALS.brand.base,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
          transform: [{ scale: s }],
        }}
      >
        <MetalFill metal="brand" />
        <Ionicons name="add" size={26} color={METALS.brand.ink} />
      </Animated.View>
    </Pressable>
  );
}
