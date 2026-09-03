import React, { useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { springConfig, useReduceMotion } from '../theme';

/**
 * the body of an accordion.
 *
 * `{open && <View>…</View>}` is the most common way to write one and the one
 * that reads worst: a block of content appears out of nothing and shoves
 * everything below it down the screen in a single frame, which is the exact
 * "jarring change" motion exists to bridge.
 *
 * one honest limitation. react native cannot animate a box from `auto` height
 * to a measured one without measuring it first, so the *container* still snaps
 * — what moves is the content inside it, rising and fading as the box opens and
 * settling back as it closes. that is enough: the eye follows the content, and
 * a snapping box with content arriving into it reads as an opening drawer,
 * where a snapping box full of already-finished content reads as a glitch.
 *
 * it stays mounted through the exit, which is why this is a component and not a
 * hook — the whole point is that the closing frames still exist.
 */
export function Reveal({ open, children }: { open: boolean; children: React.ReactNode }) {
  const reduce = useReduceMotion();
  const v = useRef(new Animated.Value(open ? 1 : 0)).current;
  // stays true through the closing animation so the exit has something to draw
  const [mounted, setMounted] = useState(open);

  useEffect(() => {
    if (open) setMounted(true);
    if (reduce) {
      v.setValue(open ? 1 : 0);
      if (!open) setMounted(false);
      return;
    }
    // a section opening is a state change, not a throw — it settles flat
    const a = Animated.spring(v, { toValue: open ? 1 : 0, ...springConfig('ui'), useNativeDriver: true });
    a.start(({ finished }) => finished && !open && setMounted(false));
    return () => a.stop();
  }, [open, v, reduce]);

  if (!mounted) return null;

  return (
    <Animated.View
      style={{
        opacity: v,
        transform: reduce
          ? []
          : [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }) }],
      }}
    >
      {children}
    </Animated.View>
  );
}

/**
 * the accordion's chevron.
 *
 * swapping `chevron-down` for `chevron-up` is two different glyphs standing in
 * for one object turning over. rotating a single one keeps it the same arrow
 * throughout, which is what makes it read as a control with a position rather
 * than an icon with two pictures.
 */
export function Chevron({ open, size = 15, color }: { open: boolean; size?: number; color?: string }) {
  const reduce = useReduceMotion();
  const v = useRef(new Animated.Value(open ? 1 : 0)).current;

  useEffect(() => {
    if (reduce) v.setValue(open ? 1 : 0);
    else Animated.spring(v, { toValue: open ? 1 : 0, ...springConfig('ui') }).start();
  }, [open, v, reduce]);

  return (
    <Animated.View
      style={{
        transform: [
          { rotate: v.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }) },
        ],
      }}
    >
      <Ionicons name="chevron-down" size={size} color={color} />
    </Animated.View>
  );
}
