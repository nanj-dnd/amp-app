import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './Text';
import { useColors, space, font, METALS } from '../theme';
import { MetalCircle, MetalBar } from './Metal';
import type { Badge } from '../badges';

/**
 * the badge grid.
 *
 * four across. earned is struck in the badge's metal; locked is an inert fill
 * with the same glyph in tertiary. the shape never changes between the two, so
 * the wall reads as one set with some of it lit rather than two sets of
 * different things — and the tier badges are the only place the four metals
 * appear together, which is what makes the ladder legible at a glance.
 *
 * locked badges carry their own progress bar and count. that is the whole
 * reason to show a locked badge at all: "32 of 50" is a reason to film again,
 * and a grey disc on its own is just an absence.
 */

const DISC = 58;
const PER_ROW = 4;

export function BadgeGrid({ badges }: { badges: Badge[] }) {
  const rows: Badge[][] = [];
  for (let i = 0; i < badges.length; i += PER_ROW) rows.push(badges.slice(i, i + PER_ROW));

  return (
    <View style={{ gap: space.xl }}>
      {rows.map((row, i) => (
        <View key={i} style={{ flexDirection: 'row', gap: space.sm }}>
          {row.map((b) => (
            <Cell key={b.id} badge={b} />
          ))}
          {/* keep the last row's columns the same width as every other row */}
          {row.length < PER_ROW &&
            Array.from({ length: PER_ROW - row.length }, (_, k) => <View key={`pad${k}`} style={{ flexGrow: 1, flexBasis: 0 }} />)}
        </View>
      ))}
    </View>
  );
}

function Cell({ badge: b }: { badge: Badge }) {
  const c = useColors();
  const showProgress = !b.earned && b.have > 0 && b.have < b.need;

  return (
    <View style={{ flexGrow: 1, flexBasis: 0, alignItems: 'center', gap: space.sm }}>
      <Disc badge={b} />

      <Text variant="tab" tone={b.earned ? 'primary' : 'tertiary'} align="center" numberOfLines={2}>
        {b.label}
      </Text>

      {showProgress && (
        <View style={{ alignItems: 'center', gap: 4, alignSelf: 'stretch' }}>
          <View style={{ height: 5, borderRadius: 2.5, backgroundColor: c.fillStrong, overflow: 'hidden', alignSelf: 'stretch' }}>
            {/* the fill is already the metal it is working toward, so the bar
                is a preview of the badge rather than a generic progress bar */}
            <MetalBar metal={b.metal} height={5} style={{ width: `${Math.min(100, (b.have / b.need) * 100)}%` }} />
          </View>
          <Text variant="tab" tone="tertiary">
            {`${b.have} of ${b.need}`}
          </Text>
        </View>
      )}
    </View>
  );
}

/**
 * the disc. earned is struck metal with the metal's own ink on it — never
 * white, because white on gold is where premium turns into cheap.
 */
function Disc({ badge: b }: { badge: Badge }) {
  const c = useColors();
  const ink = b.earned ? METALS[b.metal].ink : c.textTertiary;

  const face = b.numeral ? (
    <Text style={{ fontFamily: font.black, fontSize: 21, letterSpacing: -0.6, color: ink }}>{b.numeral}</Text>
  ) : (
    <Ionicons name={b.icon as any} size={25} color={ink} />
  );

  if (!b.earned) {
    return (
      <View
        style={{
          width: DISC,
          height: DISC,
          borderRadius: DISC / 2,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: c.fill,
        }}
      >
        {face}
      </View>
    );
  }

  return (
    <View
      style={{
        borderRadius: DISC / 2,
        shadowColor: METALS[b.metal].deep,
        shadowOpacity: 0.24,
        shadowRadius: 7,
        shadowOffset: { width: 0, height: 3 },
        elevation: 3,
      }}
    >
      <MetalCircle size={DISC} metal={b.metal}>
        {face}
      </MetalCircle>
    </View>
  );
}
