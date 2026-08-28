import React, { useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../../ui/Text';
import { GlossText } from '../../ui/GlossText';
import { Touch } from '../../ui/Pressable';
import { Button } from '../../ui/Button';
import { Card, Divider } from '../../ui/Card';
import { useColors, space, radius, font } from '../../theme';

/**
 * the war room, renamed **selector** — you have a purse and five picks, and the
 * squad has to balance. it is the only game here that punishes you two rounds
 * after the mistake, which is the point of it.
 */

type Pick = { name: string; role: Role; price: number; note: string };
type Role = 'opener' | 'middle' | 'allrounder' | 'pace' | 'spin' | 'keeper';

const PURSE = 100;

const ROUNDS: { label: string; options: Pick[] }[] = [
  {
    label: 'round 1 · the marquee',
    options: [
      { name: 'the run machine', role: 'opener', price: 42, note: 'averages 55 at the top, slow against spin' },
      { name: 'the enforcer', role: 'middle', price: 34, note: 'strike rate 160, converts one start in four' },
      { name: 'the spearhead', role: 'pace', price: 38, note: 'takes the new ball and the 19th over' },
    ],
  },
  {
    label: 'round 2 · the engine',
    options: [
      { name: 'the accumulator', role: 'middle', price: 18, note: 'never wins a game alone, never loses one either' },
      { name: 'the seam bowling all-rounder', role: 'allrounder', price: 26, note: 'four overs and a cameo' },
      { name: 'the wrist spinner', role: 'spin', price: 22, note: 'wickets in the middle, expensive when it goes' },
    ],
  },
  {
    label: 'round 3 · behind the stumps',
    options: [
      { name: 'the gloveman', role: 'keeper', price: 12, note: 'best hands in the competition, bats eight' },
      { name: 'the keeper-batter', role: 'keeper', price: 28, note: 'opens and keeps, drops two a game' },
      { name: 'the utility keeper', role: 'keeper', price: 16, note: 'solid at both, outstanding at neither' },
    ],
  },
  {
    label: 'round 4 · the bowling',
    options: [
      { name: 'the death specialist', role: 'pace', price: 24, note: 'yorkers on demand, nothing before over 15' },
      { name: 'the off-spinner', role: 'spin', price: 14, note: 'powerplay overs against left-handers' },
      { name: 'the left-arm quick', role: 'pace', price: 20, note: 'the angle nobody in this league faces' },
    ],
  },
  {
    label: 'round 5 · the last slot',
    options: [
      { name: 'the young opener', role: 'opener', price: 8, note: 'one good season, unproven against pace' },
      { name: 'the finisher', role: 'middle', price: 19, note: 'made for chases, invisible batting first' },
      { name: 'the third seamer', role: 'pace', price: 11, note: 'holds an end, takes what comes' },
    ],
  },
];

export function Selector({ onScore }: { onScore: (pts: number) => void }) {
  const c = useColors();
  const [round, setRound] = useState(0);
  const [squad, setSquad] = useState<Pick[]>([]);
  const spent = squad.reduce((s, p) => s + p.price, 0);
  const left = PURSE - spent;
  const done = round >= ROUNDS.length;

  const verdict = useMemo(() => (done ? judge(squad, left) : null), [done, squad, left]);

  const advance = (next: Pick[]) => {
    setSquad(next);
    if (round + 1 >= ROUNDS.length) onScore(judge(next, PURSE - next.reduce((s, x) => s + x.price, 0)).score);
    setRound((r) => r + 1);
  };

  const take = (p: Pick) => {
    if (p.price > left) return;
    advance([...squad, p]);
  };

  const canAfford = ROUNDS[Math.min(round, ROUNDS.length - 1)].options.some((p) => p.price <= left);

  if (done && verdict)
    return (
      <View style={{ paddingHorizontal: space.gutter, gap: space.lg }}>
        <Card style={{ gap: space.sm }}>
          <Text variant="eyebrow" tone="tertiary">
            your xi
          </Text>
          <Text variant="title">{verdict.headline}</Text>
          <Text variant="callout" tone="secondary">
            {verdict.reason}
          </Text>
        </Card>

        <Card padded={false}>
          {squad.map((p, i) => (
            <View key={p.name}>
              {i > 0 && <Divider inset={space.lg} />}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg }}>
                <View style={{ flex: 1, gap: 1 }}>
                  <Text variant="bodyStrong">{p.name}</Text>
                  <Text variant="caption" tone="tertiary">
                    {p.role}
                  </Text>
                </View>
                <Text variant="callout" style={{ fontFamily: font.bold }}>
                  {`₹${p.price}cr`}
                </Text>
              </View>
            </View>
          ))}
          <Divider />
          <View style={{ flexDirection: 'row', padding: space.lg }}>
            <Text variant="callout" tone="secondary" style={{ flex: 1 }}>
              unspent
            </Text>
            <Text variant="callout" style={{ fontFamily: font.bold }}>
              {`₹${left}cr`}
            </Text>
          </View>
        </Card>

        <Button
          label="draft again"
          kind="secondary"
          full
          icon="refresh"
          onPress={() => {
            setSquad([]);
            setRound(0);
          }}
        />
      </View>
    );

  const r = ROUNDS[round];

  return (
    <View style={{ paddingHorizontal: space.gutter, gap: space.lg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
        <Purse label="purse left" value={`₹${left}cr`} tone={left < 20 ? c.score.fair : c.brand} />
        <Purse label="picks" value={`${squad.length}/5`} />
        <View style={{ flex: 1 }} />
        <View style={{ flexDirection: 'row', gap: 4 }}>
          {ROUNDS.map((_, i) => (
            <View
              key={i}
              style={{
                width: 7,
                height: 7,
                borderRadius: 4,
                backgroundColor: i < round ? c.brand : i === round ? c.brandBorder : c.fill,
              }}
            />
          ))}
        </View>
      </View>

      <Text variant="eyebrow" tone="tertiary">
        {r.label}
      </Text>

      <View style={{ gap: space.sm }}>
        {r.options.map((p) => {
          const afford = p.price <= left;
          return (
            <Touch
              key={p.name}
              haptic="selection"
              onPress={() => take(p)}
              disabled={!afford}
              style={{
                padding: space.lg,
                borderRadius: radius.md,
                backgroundColor: c.surface,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: c.hairline,
                gap: space.xs,
                opacity: afford ? 1 : 0.42,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
                <Text variant="bodyStrong" style={{ flex: 1 }}>
                  {p.name}
                </Text>
                <GlossText
                  variant="callout"
                  color={afford ? c.brand : c.textTertiary}
                  style={{ fontFamily: font.bold }}
                >
                  {`₹${p.price}cr`}
                </GlossText>
              </View>
              <Text variant="caption" tone="secondary">
                {`${p.role} · ${p.note}`}
              </Text>
              {!afford && (
                <Text variant="tab" color={c.score.poor}>
                  out of your budget
                </Text>
              )}
            </Touch>
          );
        })}
      </View>

      {/* overspending has to cost you a player, not trap you on the screen */}
      <Touch
        haptic="medium"
        onPress={() => advance(squad)}
        style={{
          padding: space.lg,
          borderRadius: radius.md,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: c.hairline,
          backgroundColor: canAfford ? 'transparent' : c.dangerTint,
          gap: 2,
        }}
      >
        <Text variant="callout" tone={canAfford ? 'secondary' : 'danger'} align="center">
          {canAfford ? 'pass on this round' : 'you cannot afford anyone — pass'}
        </Text>
        <Text variant="tab" tone="tertiary" align="center">
          leaves the slot empty
        </Text>
      </Touch>
    </View>
  );
}

function Purse({ label, value, tone }: { label: string; value: string; tone?: string }) {
  const c = useColors();
  return (
    <View style={{ gap: 1 }}>
      <Text variant="tab" tone="tertiary">
        {label}
      </Text>
      {tone ? (
        <GlossText variant="bodyStrong" color={tone}>
          {value}
        </GlossText>
      ) : (
        <Text variant="bodyStrong">{value}</Text>
      )}
    </View>
  );
}

/** a squad is judged on balance first, then on what's left in the purse. */
function judge(squad: Pick[], left: number) {
  const has = (r: Role) => squad.some((p) => p.role === r);
  const bowlers = squad.filter((p) => p.role === 'pace' || p.role === 'spin' || p.role === 'allrounder').length;
  const batters = squad.filter((p) => p.role === 'opener' || p.role === 'middle').length;

  const gaps: string[] = [];
  const short = 5 - squad.length;
  if (short > 0) gaps.push(`${short} slot${short === 1 ? '' : 's'} unfilled`);
  if (!has('keeper')) gaps.push('nobody keeping');
  if (bowlers < 2) gaps.push('not enough bowling');
  if (batters < 2) gaps.push('too thin with the bat');
  if (!squad.some((p) => p.role === 'spin')) gaps.push('no spin option');

  const score = Math.max(10, 100 - gaps.length * 22 - Math.max(0, left - 25));

  if (gaps.length === 0)
    return {
      score,
      headline: left > 15 ? 'balanced, and you kept money back' : 'a balanced xi',
      reason: 'every role covered and enough bowling to get through twenty overs.',
    };

  return {
    score,
    headline: gaps.length === 1 ? 'one hole in it' : 'this xi does not balance',
    reason: `${gaps.join(', ')}. ${short > 0 ? 'the marquee pick spent the money the last rounds needed.' : 'the marquee pick is usually what costs you the rest.'}`,
  };
}
