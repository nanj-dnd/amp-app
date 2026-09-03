import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors, space, radius, bandFor, font, METALS, type MetalId } from '../theme';
import { Text } from './Text';
import { GlossText } from './GlossText';
import { Touch } from './Pressable';
import { MetalCircle, SheenFill, inkFor, withAlpha } from './Metal';
import { useStore } from '../state/store';
import { leagueFor } from '../state/types';

/**
 * amp score first and biggest — it is the number the product sells. streak and
 * league sit beside it because game iq runs daily and is what keeps the app
 * being opened; there is no currency here, because nothing is bought with one.
 */
/** sapphire sits above gold, so it borrows the platinum at the top of the ladder. */
const LEAGUE_METAL: Record<string, MetalId> = {
  bronze: 'bronze',
  silver: 'silver',
  gold: 'gold',
  sapphire: 'elite',
};

export function Hud({ onScorePress, onAsk }: { onScorePress?: () => void; onAsk?: () => void }) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { progression: g } = useStore();
  const band = bandFor(g.ampScore);
  const league = leagueFor(g.iqPoints);
  const rated = g.ampScore > 0;

  return (
    <View
      style={{
        paddingTop: insets.top + space.sm,
        paddingBottom: space.md,
        paddingHorizontal: space.gutter,
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.md,
        backgroundColor: c.bg,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: c.hairline,
      }}
    >
      {/*
        the number the product sells. the comment here used to say "struck in
        its band" while the chip was flat text on a 12% tint of it — a pale
        sand pill carrying the one number amp is selling. now it is actually
        struck: the band lit by the same lamp as every metal, its own colour
        thrown on the page beneath it, and the numeral in ink rather than in
        the band colour it is sitting on.
      */}
      <Touch
        onPress={onScorePress}
        haptic="selection"
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            gap: space.sm,
            paddingLeft: space.lg,
            paddingRight: space.lg,
            paddingVertical: 8,
            borderRadius: radius.pill,
            overflow: 'hidden',
            backgroundColor: rated ? c.score[band] : c.fill,
          },
          rated
            ? {
                shadowColor: c.score[band],
                shadowOpacity: 0.42,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 5 },
                elevation: 5,
              }
            : {},
        ]}
      >
        {rated && <SheenFill color={c.score[band]} />}
        <GlossText
          color={rated ? inkFor(c.score[band]) : c.textTertiary}
          style={{ fontFamily: font.black, fontSize: 23, letterSpacing: -1 }}
        >
          {rated ? String(g.ampScore) : '—'}
        </GlossText>
        <Text variant="tab" color={rated ? withAlpha(inkFor(c.score[band]), 0.72) : c.textTertiary}>
          amp score
        </Text>
      </Touch>

      <View style={{ flex: 1 }} />

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, opacity: g.streak === 0 ? 0.4 : 1 }}>
        <Ionicons name="flame" size={16} color={c.gold} />
        <Text variant="caption" style={{ fontFamily: font.bold }}>
          {String(g.streak)}
        </Text>
      </View>

      {/* bronze, silver and gold are rungs on the metals ladder — they were
          being drawn as flat brown, grey and yellow dots. */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <MetalCircle size={12} metal={LEAGUE_METAL[league.key]} />
        <Text variant="caption" tone="secondary">
          {league.label}
        </Text>
      </View>

      {onAsk && (
        <Touch
          onPress={onAsk}
          haptic="light"
          accessibilityLabel="ask amp"
          style={{
            marginLeft: space.xs,
            width: 34,
            height: 34,
            borderRadius: 17,
            backgroundColor: c.fill,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={17} color={c.textSecondary} />
        </Touch>
      )}
    </View>
  );
}
