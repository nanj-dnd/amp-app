import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../../ui/Text';
import { Touch } from '../../ui/Pressable';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { useColors, space, radius, font } from '../../theme';

/**
 * the pavilion, renamed **takes** — the light end of the daily loop. no wrong
 * answers on the split, one right answer on the puzzle, and both are built to
 * be screenshotted, which is the only distribution a daily habit gets for free.
 */

/* -------------------------------------------------------- emoji puzzle */

const PUZZLES = [
  { emoji: '🧱🧤⚡', answer: 'the wall', options: ['the wall', 'the finisher', 'the hitman', 'the wizard'] },
  { emoji: '🇮🇳👑🏏', answer: 'captain cool', options: ['captain cool', 'the master', 'the wall', 'the rocket'] },
  { emoji: '🔄🦵🎯', answer: 'the wrist spinner', options: ['the wrist spinner', 'the seamer', 'the opener', 'the keeper'] },
  { emoji: '⏱️6️⃣6️⃣', answer: 'the finisher', options: ['the finisher', 'the anchor', 'the nightwatchman', 'the wall'] },
];

export function EmojiPuzzle({ onScore }: { onScore: (pts: number) => void }) {
  const c = useColors();
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const p = PUZZLES[i % PUZZLES.length];
  const right = picked === p.answer;

  return (
    <View style={{ paddingHorizontal: space.gutter, gap: space.lg }}>
      <Card style={{ alignItems: 'center', paddingVertical: space.xxxl }}>
        <Text style={{ fontSize: 52, lineHeight: 64 }} preserveCase>
          {p.emoji}
        </Text>
      </Card>

      <View style={{ gap: space.sm }}>
        {p.options.map((o) => {
          const on = picked === o;
          const reveal = picked !== null;
          const good = o === p.answer;
          return (
            <Touch
              key={o}
              haptic={reveal ? false : 'light'}
              scale={!reveal}
              onPress={() => {
                if (reveal) return;
                setPicked(o);
                onScore(o === p.answer ? 10 : 0);
              }}
              style={{
                padding: space.lg,
                borderRadius: radius.md,
                backgroundColor: reveal && good ? c.brandTint : c.surface,
                borderWidth: reveal && (good || on) ? 1.5 : StyleSheet.hairlineWidth,
                borderColor: reveal ? (good ? c.score.good : on ? c.score.poor : c.hairline) : c.hairline,
              }}
            >
              <Text variant="callout">{o}</Text>
            </Touch>
          );
        })}
      </View>

      {picked && (
        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
          <Ionicons
            name={right ? 'checkmark-circle' : 'close-circle'}
            size={20}
            color={right ? c.brand : c.textSecondary}
          />
          <Text variant="callout" style={{ flex: 1 }}>
            {right ? 'got it' : `it was ${p.answer}`}
          </Text>
          <Button
            label="next"
            size="sm"
            icon="arrow-forward"
            onPress={() => {
              setI((v) => v + 1);
              setPicked(null);
            }}
          />
        </Card>
      )}
    </View>
  );
}

/* ----------------------------------------------------------- the split */

const SPLITS = [
  {
    q: 'you get one for the rest of your career',
    a: 'a technique that never fails under pressure',
    b: 'a temperament that never cracks under it',
    aShare: 38,
  },
  {
    q: 'which would you rather be',
    a: 'the batter everyone wants to watch',
    b: 'the batter everyone wants in a chase',
    aShare: 31,
  },
  {
    q: 'pick your weakness',
    a: 'you cannot play spin',
    b: 'you cannot play the short ball',
    aShare: 46,
  },
  {
    q: 'one over left, you pick',
    a: 'bowl it yourself',
    b: 'hand it to your best bowler and field',
    aShare: 57,
  },
];

export function TheSplit({ onScore }: { onScore: (pts: number) => void }) {
  const c = useColors();
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<'a' | 'b' | null>(null);
  const s = SPLITS[i % SPLITS.length];
  const share = picked === 'a' ? s.aShare : 100 - s.aShare;

  return (
    <View style={{ paddingHorizontal: space.gutter, gap: space.lg }}>
      <Text variant="heading">{s.q}</Text>

      <View style={{ gap: space.sm }}>
        {(['a', 'b'] as const).map((k) => {
          const on = picked === k;
          const pct = k === 'a' ? s.aShare : 100 - s.aShare;
          return (
            <Touch
              key={k}
              haptic={picked ? false : 'light'}
              scale={!picked}
              onPress={() => {
                if (picked) return;
                setPicked(k);
                onScore(3);
              }}
              style={{
                padding: space.lg,
                borderRadius: radius.md,
                backgroundColor: c.surface,
                borderWidth: on ? 1.5 : StyleSheet.hairlineWidth,
                borderColor: on ? c.brand : c.hairline,
                overflow: 'hidden',
                gap: space.sm,
              }}
            >
              {/* the bar only appears once you've committed, so it can't lead you */}
              {picked && (
                <View
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: `${pct}%`,
                    backgroundColor: on ? c.brandTint : c.fill,
                  }}
                />
              )}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                <Text variant="callout" style={{ flex: 1 }}>
                  {k === 'a' ? s.a : s.b}
                </Text>
                {picked && (
                  <Text variant="callout" tone={on ? 'brand' : 'tertiary'} style={{ fontFamily: font.bold }}>
                    {`${pct}%`}
                  </Text>
                )}
              </View>
            </Touch>
          );
        })}
      </View>

      {picked && (
        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
          <Ionicons name="people-outline" size={19} color={c.textSecondary} />
          <Text variant="callout" style={{ flex: 1 }}>
            {share >= 50 ? `you're with the ${share}%` : `you're in the ${share}%`}
          </Text>
          <Button
            label="next"
            size="sm"
            icon="arrow-forward"
            onPress={() => {
              setI((v) => v + 1);
              setPicked(null);
            }}
          />
        </Card>
      )}
    </View>
  );
}
