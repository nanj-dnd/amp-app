import React, { useRef, useEffect, useState } from 'react';
import { View, Animated, Pressable, ScrollView, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useColors, radius, space, elevation, font, springConfig, useReduceMotion } from '../theme';
import { Text } from './Text';

/**
 * ios segmented control: one sliding thumb, springs between slots.
 * replaces the four different toggle styles the old screens each invented.
 *
 * it measures itself rather than assuming. the old one divided the track by the
 * number of options and trusted the labels to fit, which held while every use
 * had two or three of them — and then progress grew a fourth tab, and a bowler
 * gets a fifth, and "ball by ball" in a 73pt slot is not a label any more.
 *
 * so the slots size to their content and the track scrolls when they no longer
 * fit. when they do fit they stretch to fill, which is the identical control it
 * has always been; nothing that fits today moves. the same measurement is what
 * makes it survive an athlete who has turned their text size up, which is the
 * more common way this breaks in the wild than a fifth tab is.
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
  const reduce = useReduceMotion();
  const idx = Math.max(0, options.findIndex((o) => o.value === value));
  const [slots, setSlots] = useState<{ x: number; w: number }[]>([]);
  const x = useRef(new Animated.Value(0)).current;
  const scroller = useRef<ScrollView>(null);
  const [track, setTrack] = useState(0);

  const pad = 3;
  const h = size === 'sm' ? 34 : 42;
  const here = slots[idx];

  // the thumb moves on a transform so it can stay on the compositor; its width
  // is a layout value and only ever changes when the control is re-measured,
  // which never happens mid-gesture.
  useEffect(() => {
    if (!here) return;
    if (reduce) x.setValue(here.x);
    else Animated.spring(x, { toValue: here.x, ...springConfig('move') }).start();

    // when the track scrolls, keep the slot you just chose on screen
    if (track > 0) {
      const overflow = slots[slots.length - 1];
      if (overflow && overflow.x + overflow.w > track) {
        scroller.current?.scrollTo({ x: Math.max(0, here.x + here.w / 2 - track / 2), animated: !reduce });
      }
    }
  }, [here?.x, here?.w, x, reduce, track, slots]);

  const measure = (i: number, layout: { x: number; width: number }) =>
    setSlots((prev) => {
      const next = [...prev];
      if (next[i]?.x === layout.x && next[i]?.w === layout.width) return prev;
      next[i] = { x: layout.x, w: layout.width };
      return next;
    });

  return (
    <ScrollView
      ref={scroller}
      horizontal
      showsHorizontalScrollIndicator={false}
      onLayout={(e) => setTrack(e.nativeEvent.layout.width - pad * 2)}
      style={{ flexGrow: 0, borderRadius: radius.md, backgroundColor: c.fill }}
      // minWidth 100% is what keeps the fitting case identical: the row fills
      // the track and the slots share it. only once the labels need more than
      // that does it become something you can scroll.
      contentContainerStyle={{ minWidth: '100%', padding: pad }}
    >
      {/* a horizontal ScrollView's content container is itself a row, so this
          row is one of its items and has to be told to grow — without it the
          slots size to their labels and pack to the left, leaving dead track. */}
      <View style={{ flexGrow: 1, flexDirection: 'row', height: h - pad * 2, position: 'relative' }}>
        {here && (
          <Animated.View
            pointerEvents="none"
            style={[
              {
                position: 'absolute',
                top: 0,
                left: 0,
                width: here.w,
                height: h - pad * 2,
                borderRadius: radius.md - 3,
                backgroundColor: c.surface,
                transform: [{ translateX: x }],
              },
              elevation.card,
            ]}
          />
        )}
        {options.map((o, i) => {
          const on = o.value === value;
          return (
            <Pressable
              key={o.value}
              onLayout={(e) => measure(i, e.nativeEvent.layout)}
              onPress={() => {
                Haptics.selectionAsync();
                onChange(o.value);
              }}
              style={{
                flexGrow: 1,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: space.md,
              }}
            >
              <Text
                variant={size === 'sm' ? 'caption' : 'callout'}
                tone={on ? 'primary' : 'secondary'}
                numberOfLines={1}
                style={{ fontFamily: on ? font.bold : font.medium }}
              >
                {o.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
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
