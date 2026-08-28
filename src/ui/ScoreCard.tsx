import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from './Text';
import { VectorMark } from './Logo';
import { font, METALS, type MetalId } from '../theme';
import { MetalGround, withAlpha } from './Metal';
import type { IndicatorResult, CardTier, Confidence } from '../indicators';

/**
 * the shareable card.
 *
 * it is deliberately not themed — a card that arrives in someone's whatsapp is
 * an artefact, not a screen, so it holds one look wherever it was made.
 *
 * the whole plate is the rating: a bronze player and an elite player hold
 * visibly different objects, and the tier needs no chip to announce itself.
 * everything printed on it is that metal's ink, never white.
 *
 * this is the third layout and the first one that isn't a stack. the previous
 * two hung six meters under a name and let the gaps sort themselves out, which
 * read as a dashboard someone had screenshotted. a card that gets posted has to
 * survive being a thumbnail: one number you can read at 200px, one name, and
 * the detail arranged so the eye can skip it.
 *
 * so the plate is now two zones with a rule between them — the hero, which is
 * all anyone sees in a feed, and a stat sheet, which is what they get if they
 * stop. the hero is sized so the two zones leave real air between them: at a
 * bigger numeral the block filled its space exactly, which put the eyebrow
 * under the wordmark and the rule against the subtitle. a number that large
 * was buying nothing a thumbnail could use. the meters are gone: six bars under six numbers said the same thing
 * twice and were the noisiest thing on the card. the tier rule under the number
 * went too, for the same reason as the chip before it — the plate is the tier.
 *
 * archivo at four weights: black for the wordmark, the rating and the name;
 * bold for the six; medium for the lines that support them; semibold for the
 * eyebrow, the tier and the footer.
 */

export type CardProps = {
  name: string;
  discipline: string;
  club?: string;
  /** the card rating: the whole achieved/possible fraction, not a mean */
  rating: number | null;
  results: IndicatorResult[];
  coverage: number;
  confidence: Confidence;
  tier: CardTier | null;
  provisional: boolean;
  /** 4:5 renders well in a feed; the width is whatever the container gives it */
  width: number;
};

export function ScoreCard({
  name,
  discipline,
  club,
  rating,
  results,
  coverage,
  confidence,
  tier,
  provisional,
  width,
}: CardProps) {
  const height = width * 1.25;
  // generous and equal on all four sides. the plate should read as a printed
  // object with a margin, not as a screen with content pushed to the edges.
  const pad = width * 0.08;
  // one rhythm; every gap below is this or a stated fraction of it
  const u = width * 0.045;

  const metal: MetalId = tier ?? 'brand';
  const m = METALS[metal];
  const ink = m.ink;
  const dim = withAlpha(ink, 0.58);
  const faint = withAlpha(ink, 0.4);
  // a true hairline vanishes at the 1080px export, so it scales with the plate
  const hair = Math.max(StyleSheet.hairlineWidth, width * 0.0015);
  const hairColor = withAlpha(ink, 0.16);

  const rows = [results.slice(0, 3), results.slice(3, 6)];

  return (
    <View style={{ width, height, borderRadius: width * 0.055, overflow: 'hidden' }}>
      <MetalGround metal={metal} width={width} height={height} radius={width * 0.055} />

      <View style={{ flex: 1, padding: pad }}>
        {/* the mark, and the tier it is struck in */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: width * 0.024 }}>
          <VectorMark size={width * 0.064} color={ink} />
          <Text style={{ fontFamily: font.black, fontSize: width * 0.062, letterSpacing: -width * 0.004, color: ink }}>
            amp
          </Text>
          <View style={{ flex: 1 }} />
          {tier && (
            <Text style={{ fontFamily: font.semibold, fontSize: width * 0.028, letterSpacing: width * 0.005, color: dim }}>
              {tier}
            </Text>
          )}
        </View>

        {/* the hero: what survives being a thumbnail */}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text
            style={{
              fontFamily: font.semibold,
              fontSize: width * 0.026,
              letterSpacing: width * 0.006,
              color: dim,
              marginBottom: u * 0.4,
            }}
          >
            amp score
          </Text>
          <Text
            style={{
              fontFamily: font.black,
              fontSize: width * 0.28,
              // kept above fontSize on purpose: a line box tighter than the
              // glyph clips digits on android, and this card is exported, not
              // laid out live, so there is no second chance to notice.
              lineHeight: width * 0.3,
              letterSpacing: -width * 0.017,
              color: ink,
            }}
          >
            {rating === null ? '—' : String(Math.round(rating))}
          </Text>
          <Text
            style={{ fontFamily: font.black, fontSize: width * 0.05, color: ink, marginTop: u * 0.7 }}
            numberOfLines={1}
          >
            {name}
          </Text>
          <Text style={{ fontFamily: font.medium, fontSize: width * 0.032, color: dim, marginTop: u * 0.15 }} numberOfLines={1}>
            {club ? `${discipline} · ${club}` : discipline}
          </Text>
        </View>

        {/* the stat sheet: ruled, so the eye can skip it in a feed and read it
            properly when it stops. an n/a keeps its cell — the athlete should
            see which of the six this session couldn't assess. */}
        <View style={{ borderTopWidth: hair, borderTopColor: hairColor }}>
          {rows.map((row, ri) => (
            <View key={ri} style={{ flexDirection: 'row', borderTopWidth: ri > 0 ? hair : 0, borderTopColor: hairColor }}>
              {row.map((r, ci) => (
                <View
                  key={r.indicator.id}
                  style={{
                    flexGrow: 1,
                    flexBasis: 0,
                    alignItems: 'center',
                    paddingVertical: u * 0.62,
                    borderLeftWidth: ci > 0 ? hair : 0,
                    borderLeftColor: hairColor,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: font.bold,
                      fontSize: width * 0.056,
                      letterSpacing: -width * 0.002,
                      color: r.score === null ? withAlpha(ink, 0.34) : ink,
                    }}
                  >
                    {r.score === null ? 'n/a' : String(Math.round(r.score))}
                  </Text>
                  <Text
                    style={{ fontFamily: font.medium, fontSize: width * 0.026, color: dim, marginTop: u * 0.12 }}
                    numberOfLines={1}
                  >
                    {r.indicator.label}
                  </Text>
                </View>
              ))}
            </View>
          ))}
        </View>

        {/* coverage rides with the rating, always. an 84 on 40% coverage is not
            an 84, and the card is where that has to be said. */}
        <View style={{ alignItems: 'center', marginTop: u * 0.8 }}>
          <Text
            style={{
              fontFamily: font.medium,
              fontSize: width * 0.026,
              letterSpacing: 0.3,
              textAlign: 'center',
              color: provisional ? ink : dim,
            }}
          >
            {provisional
              ? `provisional · ${Math.round(coverage * 100)}% assessable`
              : `${Math.round(coverage * 100)}% coverage · ${confidence} confidence`}
          </Text>
          <Text
            style={{
              fontFamily: font.semibold,
              fontSize: width * 0.026,
              letterSpacing: width * 0.0014,
              color: faint,
              marginTop: u * 0.4,
            }}
          >
            tryamp.in
          </Text>
        </View>
      </View>
    </View>
  );
}
