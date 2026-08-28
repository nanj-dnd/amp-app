import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { Text } from './Text';
import { VectorMark } from './Logo';
import { font, space, radius, bandFor, light } from '../theme';
import { shares, type Component } from '../ampScore';

/**
 * the shareable card.
 *
 * it is deliberately not themed — a card that arrives in someone's whatsapp is
 * an artefact, not a screen, so it holds one look wherever it was made. the
 * ground is the brand green with the road mark receding into it, because the
 * one thing this image has to do before it is read is say "amp".
 *
 * the previous version was a gold-to-brown gradient with three loose bars on
 * it: the gold fought the brand, and three bars implied three scores when
 * there is only ever one, made of three parts.
 */

const INK = '#FFFFFF';
const GREEN_TOP = '#0B3F2C';
const GREEN_BOT = '#186D4C';

export type CardProps = {
  name: string;
  discipline: string;
  club?: string;
  ageBand: string;
  score: number | null;
  components: Component[];
  strength?: string;
  /** 4:5 renders well in a feed; the width is whatever the container gives it */
  width: number;
};

export function ScoreCard({ name, discipline, club, ageBand, score, components: comps, strength, width }: CardProps) {
  // 1.4 rather than 4:5 — at 1.25 the strength block ran off the bottom edge,
  // and a taller card sits better in a story anyway
  const height = width * 1.4;
  const band = score === null ? 'fair' : bandFor(score);
  const accent = light.score[band];
  const parts = shares(comps);
  const pad = width * 0.07;

  return (
    <View
      style={{
        width,
        height,
        borderRadius: radius.xl,
        overflow: 'hidden',
        backgroundColor: GREEN_TOP,
      }}
    >
      {/* ground: a gradient with the mark's road receding up it */}
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="g" x1="0" y1="0" x2="0.4" y2="1">
            <Stop offset="0" stopColor={GREEN_TOP} />
            <Stop offset="1" stopColor={GREEN_BOT} />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width={width} height={height} fill="url(#g)" />
        {/* the road, receding — kept faint and low so it reads as ground */}
        <Path
          d={`M ${width * 0.5 - width * 0.05} ${height * 0.52}
              L ${width * 0.5 + width * 0.05} ${height * 0.52}
              L ${width * 1.18} ${height}
              L ${width * -0.18} ${height} Z`}
          fill={INK}
          opacity={0.035}
        />
        <Path
          d={`M ${width * 0.5} ${height * 0.55} L ${width * 0.5} ${height}`}
          stroke={INK}
          strokeWidth={width * 0.014}
          strokeDasharray={`${width * 0.055} ${width * 0.07}`}
          opacity={0.06}
        />
      </Svg>

      <View style={{ flex: 1, padding: pad, justifyContent: 'space-between' }}>
        {/* header: the mark, and who this is */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: width * 0.028 }}>
          <VectorMark size={width * 0.075} color={INK} />
          <Text style={{ fontFamily: font.black, fontSize: width * 0.072, letterSpacing: -width * 0.004, color: INK }}>
            amp
          </Text>
          <View style={{ flex: 1 }} />
          <View
            style={{
              paddingHorizontal: width * 0.032,
              paddingVertical: width * 0.012,
              borderRadius: radius.pill,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.35)',
            }}
          >
            <Text style={{ fontFamily: font.bold, fontSize: width * 0.033, letterSpacing: 0.6, color: INK }}>
              {ageBand}
            </Text>
          </View>
        </View>

        {/* the number, given the room it needs */}
        <View style={{ alignItems: 'center' }}>
          <Text
            style={{
              fontFamily: font.black,
              fontSize: width * 0.36,
              lineHeight: width * 0.38,
              letterSpacing: -width * 0.022,
              color: INK,
            }}
          >
            {score === null ? '—' : String(score)}
          </Text>
          {/* a rule in the band colour instead of a word for it */}
          <View
            style={{
              marginTop: width * 0.03,
              width: width * 0.16,
              height: width * 0.014,
              borderRadius: width * 0.007,
              backgroundColor: accent,
            }}
          />
        </View>

        <View style={{ gap: width * 0.04 }}>
          <View style={{ alignItems: 'center', gap: 2 }}>
            <Text style={{ fontFamily: font.black, fontSize: width * 0.058, color: INK }} numberOfLines={1}>
              {name}
            </Text>
            <Text style={{ fontFamily: font.medium, fontSize: width * 0.036, color: 'rgba(255,255,255,0.66)' }} numberOfLines={1}>
              {club ? `${discipline} · ${club}` : discipline}
            </Text>
          </View>

          {/* one bar, three parts — because there is one score, not three */}
          <View style={{ gap: width * 0.022 }}>
            <View
              style={{
                flexDirection: 'row',
                height: width * 0.022,
                borderRadius: width * 0.011,
                overflow: 'hidden',
                backgroundColor: 'rgba(255,255,255,0.16)',
              }}
            >
              {parts.map((p, i) =>
                p.share === 0 ? null : (
                  <View
                    key={p.id}
                    style={{
                      flexGrow: p.share,
                      flexBasis: 0,
                      backgroundColor: INK,
                      opacity: 1 - i * 0.3,
                      marginRight: i < parts.length - 1 ? 2 : 0,
                    }}
                  />
                ),
              )}
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              {parts.map((p, i) => (
                <View key={p.id} style={{ flexGrow: 1, flexBasis: 0, alignItems: i === 0 ? 'flex-start' : i === 1 ? 'center' : 'flex-end' }}>
                  <Text style={{ fontFamily: font.bold, fontSize: width * 0.048, color: p.score === null ? 'rgba(255,255,255,0.42)' : INK }}>
                    {p.score === null ? '—' : String(p.score)}
                  </Text>
                  <Text style={{ fontFamily: font.medium, fontSize: width * 0.03, color: 'rgba(255,255,255,0.55)' }}>
                    {`${p.label} ${p.weight}%`}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {strength && (
            <View
              style={{
                paddingHorizontal: width * 0.04,
                paddingVertical: width * 0.03,
                borderRadius: radius.md,
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderLeftWidth: 3,
                borderLeftColor: accent,
              }}
            >
              <Text style={{ fontFamily: font.semibold, fontSize: width * 0.028, letterSpacing: 0.8, color: 'rgba(255,255,255,0.6)' }}>
                strongest
              </Text>
              <Text style={{ fontFamily: font.bold, fontSize: width * 0.04, color: INK }} numberOfLines={1}>
                {strength}
              </Text>
            </View>
          )}

          <Text
            style={{
              fontFamily: font.semibold,
              fontSize: width * 0.03,
              letterSpacing: 1.2,
              color: 'rgba(255,255,255,0.45)',
              textAlign: 'center',
            }}
          >
            tryamp.in
          </Text>
        </View>
      </View>
    </View>
  );
}
