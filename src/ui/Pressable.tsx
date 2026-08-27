import React, { useRef } from 'react';
import { Animated, Pressable as RNPressable, type PressableProps, type ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { motion } from '../theme';

/**
 * one animated node, not a styled view inside an unstyled pressable — the
 * wrapper has to be the flex child itself, or `flex: 1` lands on an element
 * that isn't participating in the parent's layout and every row of these
 * shrink-wraps to its text.
 */
const AnimatedPressable = Animated.createAnimatedComponent(RNPressable);

export type TouchProps = Omit<PressableProps, 'style' | 'children'> & {
  children?: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  /** scale-down on press. off for full-bleed rows where it looks wobbly. */
  scale?: boolean;
  haptic?: false | 'light' | 'medium' | 'selection';
};

export function Touch({ style, scale = true, haptic = 'light', onPressIn, onPressOut, children, ...rest }: TouchProps) {
  const v = useRef(new Animated.Value(1)).current;

  const to = (t: number) =>
    Animated.spring(v, { toValue: t, useNativeDriver: true, ...motion.spring }).start();

  return (
    <AnimatedPressable
      {...rest}
      style={[style as ViewStyle, { transform: [{ scale: v }] }]}
      onPressIn={(e) => {
        if (scale) to(motion.pressScale);
        if (haptic === 'selection') Haptics.selectionAsync();
        else if (haptic)
          Haptics.impactAsync(
            haptic === 'medium' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light,
          );
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        if (scale) to(1);
        onPressOut?.(e);
      }}
    >
      {children}
    </AnimatedPressable>
  );
}
