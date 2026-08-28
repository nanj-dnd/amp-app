import React, { useState } from 'react';
import { View, StyleSheet, type TextStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';
import { Text } from './Text';
import { type as typeScale } from '../theme';

/**
 * a number struck in its own colour.
 *
 * every other glossy thing on the platform is a surface with a gradient behind
 * it, but a score is type — there is no box to light, and react native has no
 * way to pour a gradient into a glyph. so the number is drawn twice: once as a
 * real <Text> at zero opacity, purely to hold its place in the layout and
 * report its size, and once as svg text laid over that hole with the gradient
 * as its fill.
 *
 * measuring rather than estimating matters: these numbers change width with
 * their value (68 to 100) and with the platform's font metrics, and a guessed
 * box clips the last digit on exactly the reading nobody wants clipped.
 *
 * until the measurement lands the plain text is shown at full opacity, so the
 * number is never missing — it just isn't lit for a frame.
 *
 * the variant has to be resolved here, not just passed through. <Text> applies
 * its variant's size and family itself, so reading them off the style prop
 * alone leaves svg drawing a 16px system-font number over a 34px archivo hole:
 * every callsite that used a variant instead of an inline style came out as a
 * tiny stub in the corner.
 */
export function GlossText({
  children,
  color,
  style,
  variant,
}: {
  children: string;
  color: string;
  style?: TextStyle;
  variant?: React.ComponentProps<typeof Text>['variant'];
}) {
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  const id = `gloss-${React.useId().replace(/:/g, '')}`;

  // the variant's tokens first, then any inline style on top — the same order
  // <Text> resolves them in, so the svg copy matches the hole exactly
  const flat = StyleSheet.flatten([variant ? typeScale[variant] : typeScale.body, style]) as TextStyle;
  const size = (flat?.fontSize as number) ?? 16;
  const family = flat?.fontFamily as string | undefined;
  const spacing = (flat?.letterSpacing as number) ?? 0;

  return (
    <View>
      <Text
        variant={variant}
        color={color}
        style={[style, { opacity: box ? 0 : 1 }]}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          if (!box || Math.abs(box.w - width) > 0.5 || Math.abs(box.h - height) > 0.5) {
            setBox({ w: width, h: height });
          }
        }}
      >
        {children}
      </Text>

      {box && (
        <Svg width={box.w} height={box.h} style={StyleSheet.absoluteFill} pointerEvents="none">
          <Defs>
            <LinearGradient id={id} x1="0" y1="0" x2="0.25" y2="1">
              <Stop offset="0" stopColor={shift(color, 0.22)} />
              <Stop offset="0.46" stopColor={color} />
              <Stop offset="1" stopColor={shift(color, -0.16)} />
            </LinearGradient>
          </Defs>
          <SvgText
            x={0}
            // svg text sits on its baseline; a line box puts the baseline at
            // roughly 0.78 of its height for the weights amp uses
            y={box.h * 0.78}
            fontSize={size}
            fontFamily={family}
            letterSpacing={spacing}
            fill={`url(#${id})`}
          >
            {children.toLowerCase()}
          </SvgText>
        </Svg>
      )}
    </View>
  );
}

/** mix a hex toward white (t > 0) or black (t < 0). */
function shift(hex: string, t: number): string {
  const n = parseInt(hex.slice(1), 16);
  const to = t > 0 ? 255 : 0;
  const a = Math.abs(t);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) =>
    Math.max(0, Math.min(255, Math.round(v + (to - v) * a))),
  );
  return `#${ch.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}
