import React, { useState } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Circle, Line, G } from 'react-native-svg';
import { Text } from '../../ui/Text';
import { Touch } from '../../ui/Pressable';
import { Button } from '../../ui/Button';
import { Sheet } from '../../ui/Sheet';
import { useColors, space, radius, font } from '../../theme';
import { REGIONS, SHOTS, mirrorAngle } from '../../match/types';

/**
 * placement and shot type, in one sheet with one tap each. cricheroes puts these
 * on two separate full screens per scoring shot, which is why most scorers turn
 * the feature off — and this is exactly the data amp needs, so it has to be fast
 * enough that nobody does.
 */
export function ShotSheet({
  runs,
  hand = 'right',
  onDone,
  onSkip,
}: {
  runs: number;
  /** a left-hander's off and leg sides are mirrored on screen */
  hand?: 'right' | 'left';
  onDone: (shot?: string, region?: string) => void;
  onSkip: () => void;
}) {
  const c = useColors();
  const { width } = useWindowDimensions();
  const [region, setRegion] = useState<string | null>(null);
  const [shot, setShot] = useState<string | null>(null);

  const size = Math.min(width - space.gutter * 2, 300);
  const R = size / 2;

  return (
    <Sheet onClose={onSkip} scroll>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text variant="heading">{`${runs} run${runs === 1 ? '' : 's'} — where?`}</Text>
            <Text variant="caption" tone="secondary">
              {`${hand === 'left' ? 'left' : 'right'}-hander · tap the area, then the shot. both optional.`}
            </Text>
          </View>
          <Touch scale={false} haptic="light" onPress={onSkip}>
            <Text variant="callout" tone="tertiary">
              skip
            </Text>
          </Touch>
        </View>

        {/* wagon wheel — tap a wedge */}
        <View style={{ alignSelf: 'center', width: size, height: size }}>
          <Svg width={size} height={size}>
            <Circle cx={R} cy={R} r={R - 2} fill={c.brandTint} stroke={c.brandBorder} strokeWidth={1.5} />
            <Circle cx={R} cy={R} r={(R - 2) * 0.55} fill="none" stroke={c.hairline} strokeWidth={1} />
            <G>
              {[0, 45, 90, 135].map((a) => {
                const rad = (a * Math.PI) / 180;
                return (
                  <Line
                    key={a}
                    x1={R - (R - 2) * Math.cos(rad)}
                    y1={R - (R - 2) * Math.sin(rad)}
                    x2={R + (R - 2) * Math.cos(rad)}
                    y2={R + (R - 2) * Math.sin(rad)}
                    stroke={c.hairline}
                    strokeWidth={1}
                  />
                );
              })}
            </G>
            <Circle cx={R} cy={R} r={5} fill={c.brand} />
          </Svg>

          <Text
            variant="tab"
            tone="tertiary"
            style={{ position: 'absolute', left: R - 14, top: 6 }}
          >
            bowler
          </Text>

          {/* the tappable labels sit over the svg so they render in archivo */}
          {REGIONS.map((r) => {
            // the region id stays canonical — cover is cover for either hand;
            // only where it is drawn flips
            const angle = hand === 'left' ? mirrorAngle(r.angle) : r.angle;
            const rad = (angle * Math.PI) / 180;
            const dist = R * 0.68;
            const on = region === r.id;
            return (
              <Touch
                key={r.id}
                haptic="selection"
                onPress={() => setRegion(on ? null : r.id)}
                style={{
                  position: 'absolute',
                  left: R + dist * Math.cos(rad) - 38,
                  top: R - dist * Math.sin(rad) - 13,
                  width: 76,
                  height: 26,
                  borderRadius: radius.pill,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: on ? c.brand : c.surface,
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: on ? c.brand : c.hairline,
                }}
              >
                <Text variant="tab" tone={on ? 'onBrand' : 'secondary'} numberOfLines={1}>
                  {r.label}
                </Text>
              </Touch>
            );
          })}
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
          {SHOTS.map((s) => {
            const on = shot === s;
            return (
              <Touch
                key={s}
                haptic="selection"
                onPress={() => setShot(on ? null : s)}
                style={{
                  paddingHorizontal: space.md,
                  height: 34,
                  borderRadius: radius.pill,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: on ? c.brand : c.fill,
                }}
              >
                <Text variant="caption" tone={on ? 'onBrand' : 'secondary'}>
                  {s}
                </Text>
              </Touch>
            );
          })}
        </View>

      <Button label="done" size="lg" full onPress={() => onDone(shot ?? undefined, region ?? undefined)} />
    </Sheet>
  );
}
