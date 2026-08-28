import React, { useEffect, useRef } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
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

const CHIP = 40;
const GAP = 18;

/**
 * the plan, as a row of weeks on a line.
 *
 * this was a tapering ribbon with a dashed centre line — a lot of drawing to
 * say "these happen in order". a single rule through the middle says the same
 * thing and lets the chips do the work. the flag is the last chip, the same
 * size as the rest, because it is the last week rather than a separate object.
 */
export function WeekStrip({ weeks, onPick }: { weeks: StripWeek[]; onPick: (w: StripWeek) => void }) {
  const c = useColors();
  const ref = useRef<ScrollView>(null);
  const current = weeks.findIndex((w) => w.state === 'current');

  useEffect(() => {
    const t = setTimeout(
      () => ref.current?.scrollTo({ x: Math.max(0, (current - 1) * (CHIP + GAP)), animated: false }),
      40,
    );
    return () => clearTimeout(t);
  }, [current]);

  return (
    <ScrollView
      ref={ref}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: space.gutter, paddingVertical: space.sm }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {weeks.map((w, i) => (
          <React.Fragment key={w.key}>
            {i > 0 && <Rule done={w.state === 'done'} />}
            <Chip week={w} onPress={() => onPick(w)} />
          </React.Fragment>
        ))}

        <Rule done={false} />
        {/* the goal, as the last chip in the line */}
        <View
          style={{
            width: CHIP,
            height: CHIP,
            borderRadius: CHIP / 2,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: c.brandTint,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: c.brandBorder,
          }}
        >
          <Ionicons name="flag" size={16} color={c.brand} />
        </View>
      </View>
    </ScrollView>
  );
}

function Rule({ done }: { done: boolean }) {
  const c = useColors();
  return <View style={{ width: GAP, height: 2, backgroundColor: done ? c.brand : c.fillStrong }} />;
}

function Chip({ week, onPress }: { week: StripWeek; onPress: () => void }) {
  const c = useColors();
  const done = week.state === 'done';
  const current = week.state === 'current';

  return (
    <Touch haptic="selection" onPress={onPress}>
      <View
        style={{
          width: CHIP,
          height: CHIP,
          borderRadius: CHIP / 2,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: done ? c.brand : current ? c.surface : c.fill,
          borderWidth: current ? 2 : StyleSheet.hairlineWidth,
          borderColor: current ? c.brand : c.hairline,
        }}
      >
        {done ? (
          <Ionicons name="checkmark" size={18} color={c.textOnBrand} />
        ) : (
          <Text
            style={{ fontFamily: font.black, fontSize: 14, color: current ? c.brand : c.textTertiary }}
          >
            {String(week.index)}
          </Text>
        )}

        {/* a review week gets a dot rather than a word under it, so the row
            stays one height */}
        {week.isMilestone && (
          <View
            style={{
              position: 'absolute',
              bottom: -1,
              width: 5,
              height: 5,
              borderRadius: 3,
              backgroundColor: done ? c.brandBright : c.textTertiary,
              borderWidth: 1.5,
              borderColor: c.bg,
            }}
          />
        )}
      </View>
    </Touch>
  );
}
