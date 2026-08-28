import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors, space, radius, bandFor, font } from '../theme';
import { Text } from './Text';
import { GlossText } from './GlossText';
import { Touch } from './Pressable';
import { useStore } from '../state/store';
import { leagueFor } from '../state/types';

/**
 * amp score first and biggest — it is the number the product sells. streak and
 * league sit beside it because game iq runs daily and is what keeps the app
 * being opened; there is no currency here, because nothing is bought with one.
 */
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
      <Touch
        onPress={onScorePress}
        haptic="selection"
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: space.sm,
          paddingLeft: space.md,
          paddingRight: space.lg,
          paddingVertical: 7,
          borderRadius: radius.pill,
          backgroundColor: rated ? c.score[band] + '1F' : c.fill,
        }}
      >
        {/* the number the product sells, struck in its band */}
        <GlossText
          color={rated ? c.score[band] : c.textTertiary}
          style={{ fontFamily: font.black, fontSize: 23, letterSpacing: -1 }}
        >
          {rated ? String(g.ampScore) : '—'}
        </GlossText>
        <Text variant="tab" tone="tertiary">
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

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
        <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: league.colour }} />
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
