import React, { useRef } from 'react';
import { Animated, Pressable as RNPressable, type PressableProps, type ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { motion, springConfig, useReduceMotion } from '../theme';

/**
 * one animated node, not a styled view inside an unstyled pressable — the
 * wrapper has to be the flex child itself, or `flex: 1` lands on an element
 * that isn't participating in the parent's layout and every row of these
 * shrink-wraps to its text.
 *
 * two things this gets right that a plain Pressable does not:
 *
 * the scale lands on press *down*, not on release. the instant the feeling of
 * directness costs a frame it falls off a cliff, and waiting for touch-up to
 * acknowledge a touch is the most expensive frame in an app.
 *
 * and it settles without overshoot. a press is not a throw — nothing about
 * putting a finger on a button carries momentum, so nothing about letting go
 * should bounce. bounce is reserved for the gestures that earn it: drags,
 * flicks, anything you actually threw.
 */
const AnimatedPressable = Animated.createAnimatedComponent(RNPressable);

/** ~10px of slop so the edge of a control isn't a cliff (§ gesture details). */
const SLOP = { top: 6, bottom: 6, left: 6, right: 6 };

export type TouchProps = Omit<PressableProps, 'style' | 'children'> & {
  children?: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  /** scale-down on press. off for full-bleed rows where it looks wobbly. */
  scale?: boolean;
  haptic?: false | 'light' | 'medium' | 'selection';
};

export function Touch({
  style,
  scale = true,
  haptic = 'light',
  hitSlop = SLOP,
  onPressIn,
  onPressOut,
  children,
  ...rest
}: TouchProps) {
  const reduce = useReduceMotion();
  const v = useRef(new Animated.Value(1)).current;

  // Animated.spring always starts from where the value currently is, so a
  // press released mid-recoil reverses from the exact on-screen scale instead
  // of snapping back to 1 first.
  const to = (t: number) => Animated.spring(v, { toValue: t, ...springConfig('press') }).start();

  const wants = scale && !reduce;

  return (
    <AnimatedPressable
      {...rest}
      hitSlop={hitSlop}
      style={[style as ViewStyle, { transform: [{ scale: v }] }]}
      onPressIn={(e) => {
        if (wants) to(motion.pressScale);
        if (haptic === 'selection') Haptics.selectionAsync();
        else if (haptic)
          Haptics.impactAsync(
            haptic === 'medium' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light,
          );
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        if (wants) to(1);
        onPressOut?.(e);
      }}
    >
      {children}
    </AnimatedPressable>
  );
}
