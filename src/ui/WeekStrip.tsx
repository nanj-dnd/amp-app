import React, { useEffect, useRef } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './Text';
import { Touch } from './Pressable';
import { useColors, space, radius, font } from '../theme';

export type StripWeek = {
  key: string;
  index: number;
  state: 'done' | 'current' | 'ahead';
  progress: number;
  isMilestone: boolean;
};

const CHIP = 44;
const GAP = 12;
const STEP = CHIP + GAP;

/**
 * the road, as a strip.
 *
 * it used to be a full-screen perspective ramp: pretty, but it pushed the only
 * thing you can act on — this week — below the fold, and twelve weeks of empty
 * tarmac is a lot of screen to say "not yet". the metaphor survives as a
 * ribbon that narrows toward the flag; the screen goes back to the work.
 */
export function WeekStrip({
  weeks,
  onPick,
}: {
  weeks: StripWeek[];
  onPick: (w: StripWeek) => void;
}) {
  const c = useColors();
  const ref = useRef<ScrollView>(null);
  const current = weeks.findIndex((w) => w.state === 'current');

  useEffect(() => {
    const t = setTimeout(
      () => ref.current?.scrollTo({ x: Math.max(0, (current - 1) * STEP), animated: false }),
      40,
    );
    return () => clearTimeout(t);
  }, [current]);

  const width = weeks.length * STEP + 60;

  return (
    <View>
      <ScrollView
        ref={ref}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: space.gutter, paddingVertical: space.sm }}
      >
        <View style={{ width, height: CHIP + 30, justifyContent: 'center' }}>
          {/* the ribbon: wide where you are, narrowing to the flag */}
          <Svg width={width} height={CHIP + 30} style={{ position: 'absolute' }} pointerEvents="none">
            <Path
              d={`M 0 ${CHIP / 2 + 13 - 11} L ${width - 40} ${CHIP / 2 + 13 - 4} L ${width - 40} ${CHIP / 2 + 13 + 4} L 0 ${CHIP / 2 + 13 + 11} Z`}
              fill={c.fill}
            />
            <Path
              d={`M 0 ${CHIP / 2 + 13} L ${width - 44} ${CHIP / 2 + 13}`}
              stroke={c.hairline}
              strokeWidth={2}
              strokeDasharray="9 11"
            />
          </Svg>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: GAP }}>
            {weeks.map((w) => (
              <Chip key={w.key} week={w} onPress={() => onPick(w)} />
            ))}

            {/* the flag at the end of the road */}
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                marginLeft: GAP,
                backgroundColor: c.brandTint,
                borderWidth: 1.5,
                borderColor: c.brandBorder,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="flag" size={17} color={c.brand} />
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function Chip({ week, onPress }: { week: StripWeek; onPress: () => void }) {
  const c = useColors();
  const done = week.state === 'done';
  const current = week.state === 'current';

  return (
    <Touch haptic="selection" onPress={onPress} style={{ alignItems: 'center', gap: 4 }}>
      <View
        style={{
          width: CHIP,
          height: CHIP,
          borderRadius: CHIP / 2,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: done ? c.brand : current ? c.surface : c.fill,
          borderWidth: current ? 2.5 : StyleSheet.hairlineWidth,
          borderColor: current ? c.brand : c.hairline,
        }}
      >
        {done ? (
          <Ionicons name="checkmark" size={20} color={c.textOnBrand} />
        ) : (
          <Text
            style={{
              fontFamily: font.black,
              fontSize: 15,
              color: current ? c.brand : c.textTertiary,
            }}
          >
            {String(week.index)}
          </Text>
        )}

        {/* part-done weeks carry a small arc rather than a second shape */}
        {current && week.progress > 0 && (
          <View
            style={{
              position: 'absolute',
              bottom: -1,
              height: 3,
              width: CHIP * 0.6 * week.progress,
              borderRadius: 2,
              backgroundColor: c.brand,
            }}
          />
        )}
      </View>

      {/* the caption row is always present so chips never jump height */}
      <View style={{ height: 13, justifyContent: 'center' }}>
        {week.isMilestone && (
          <Text variant="tab" tone={done ? 'brand' : 'tertiary'} style={{ fontSize: 8.5 }}>
            review
          </Text>
        )}
      </View>
    </Touch>
  );
}
