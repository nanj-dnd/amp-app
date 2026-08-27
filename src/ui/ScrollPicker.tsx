import React, { useRef, useMemo, useEffect } from 'react';
import { View, ScrollView, StyleSheet, type NativeSyntheticEvent, type NativeScrollEvent } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useColors, space, radius, font } from '../theme';
import { Text } from './Text';

const ROW = 46;
const VISIBLE = 5; // two rows of context either side of the selection

/**
 * ios-style snapping wheel. height, weight and age are all "pick a number in a
 * known range" questions — a wheel answers them in one gesture, where a pair of
 * +/- buttons needs thirty taps to move from 170cm to 185cm.
 */
export function ScrollPicker({
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
  width = 110,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  width?: number;
}) {
  const c = useColors();
  const ref = useRef<ScrollView>(null);
  const last = useRef(value);

  // laid out high-to-low: dragging the wheel *down* brings bigger numbers into
  // the window, which is the direction people reach for on a physical dial.
  const values = useMemo(() => {
    const out: number[] = [];
    for (let v = max; v >= min - 1e-9; v -= step) out.push(Math.round(v * 100) / 100);
    return out;
  }, [min, max, step]);

  const indexOf = (v: number) => {
    const i = Math.round((max - v) / step);
    return Math.min(values.length - 1, Math.max(0, i));
  };

  // keep the wheel in sync when the value is changed from outside
  useEffect(() => {
    ref.current?.scrollTo({ y: indexOf(value) * ROW, animated: false });
    // only on mount / range change — scrolling on every value change fights the gesture
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [min, max, step]);

  const settle = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.y / ROW);
    const v = values[Math.min(values.length - 1, Math.max(0, i))];
    if (v !== undefined && v !== last.current) {
      last.current = v;
      onChange(v);
    }
  };

  const tick = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.y / ROW);
    const v = values[Math.min(values.length - 1, Math.max(0, i))];
    if (v !== undefined && v !== last.current) {
      last.current = v;
      Haptics.selectionAsync();
      onChange(v);
    }
  };

  return (
    <View style={{ height: ROW * VISIBLE, width, alignItems: 'center' }}>
      {/* the selection band sits behind the rows */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: ROW * 2,
          height: ROW,
          left: 0,
          right: 0,
          borderRadius: radius.sm,
          backgroundColor: c.brandTint,
        }}
      />

      <ScrollView
        ref={ref}
        showsVerticalScrollIndicator={false}
        snapToInterval={ROW}
        decelerationRate="fast"
        onScroll={tick}
        scrollEventThrottle={16}
        onMomentumScrollEnd={settle}
        onScrollEndDrag={settle}
        contentContainerStyle={{ paddingVertical: ROW * 2 }}
      >
        {values.map((v) => {
          const on = Math.abs(v - value) < step / 2;
          return (
            <View key={v} style={{ height: ROW, alignItems: 'center', justifyContent: 'center' }}>
              <Text
                style={{
                  fontFamily: on ? font.black : font.medium,
                  fontSize: on ? 26 : 20,
                  letterSpacing: -0.8,
                  color: on ? c.brand : c.textTertiary,
                }}
              >
                {Number.isInteger(v) ? String(v) : v.toFixed(1)}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      {unit && (
        <Text variant="caption" tone="tertiary" style={{ position: 'absolute', bottom: 0 }}>
          {unit}
        </Text>
      )}
    </View>
  );
}

/** two wheels side by side with a shared frame — height + weight in one block. */
export function PickerRow({ children }: { children: React.ReactNode }) {
  const c = useColors();
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: c.surface,
        borderRadius: radius.lg,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: c.hairline,
        paddingVertical: space.md,
      }}
    >
      {children}
    </View>
  );
}
