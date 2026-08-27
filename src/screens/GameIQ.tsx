import React, { useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../ui/Text';
import { Touch } from '../ui/Pressable';
import { Card } from '../ui/Card';
import { IconButton } from '../ui/Button';
import { useColors, space, radius, font } from '../theme';
import { TAB_BAR_SPACE } from '../ui/TabBar';
import { useStore } from '../state/store';
import { IQ_GAMES, replayGame, GROUP_LABELS, GROUP_ORDER, type IqGame } from '../gameiq';
import { leagueFor } from '../state/types';
import { ScenarioCard } from './iq/ScenarioCard';
import { SlipReflex, TimingBar, CatchDrill } from './iq/Reactions';
import { Selector } from './iq/Selector';
import { EmojiPuzzle, TheSplit } from './iq/Takes';

/**
 * four suites, renamed to say what they actually test:
 *   decisions  the scenario questions — what to do, and why
 *   reactions  was "the nets" — reflex, timing, hands
 *   selector   was "the war room" — a purse and five picks
 *   takes      was "the pavilion" — puzzles and opinion splits
 *
 * the old names were places; these are the things being measured, which is what
 * a lobby item has to tell you in two words.
 */
export type SuiteKey = 'decisions' | 'reactions' | 'selector' | 'takes';

export const SUITES: { key: SuiteKey; label: string; blurb: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'decisions', label: 'decisions', blurb: 'read the situation, make the call', icon: 'git-branch-outline' },
  { key: 'reactions', label: 'reactions', blurb: 'reflex, timing and hands', icon: 'flash-outline' },
  { key: 'selector', label: 'selector', blurb: 'one purse, five picks, one xi', icon: 'people-outline' },
  { key: 'takes', label: 'takes', blurb: 'puzzles and opinion splits', icon: 'chatbubbles-outline' },
];

/** the non-scenario games, keyed so the lobby and the player agree. */
type MiniKey = 'slip' | 'timing' | 'catch' | 'purse' | 'emoji' | 'split';

const MINIS: { key: MiniKey; suite: SuiteKey; label: string; blurb: string; seconds?: string }[] = [
  { key: 'slip', suite: 'reactions', label: 'slip reflex', blurb: 'how fast you pick it up' },
  { key: 'timing', suite: 'reactions', label: 'timing bar', blurb: 'rhythm, and it speeds up' },
  { key: 'catch', suite: 'reactions', label: 'catching drill', blurb: 'hands, under pressure' },
  { key: 'purse', suite: 'selector', label: 'the five-round purse', blurb: 'balance an xi on a budget' },
  { key: 'emoji', suite: 'takes', label: 'emoji puzzle', blurb: 'name the player' },
  { key: 'split', suite: 'takes', label: 'the split', blurb: 'where you land vs everyone' },
];

export function GameIQScreen({ go }: { go: (r: string) => void }) {
  const { profile, progression } = useStore();
  const [suite, setSuite] = useState<SuiteKey>('decisions');
  const [playing, setPlaying] = useState<IqGame | null>(null);
  const [mini, setMini] = useState<MiniKey | null>(null);

  const games = useMemo(() => {
    const replay = progression.hasFirstReport
      ? [replayGame('head falling away at contact', profile.discipline)]
      : [];
    return [...replay, ...IQ_GAMES];
  }, [progression.hasFirstReport, profile.discipline]);

  if (playing) return <PlayScreen game={playing} onExit={() => setPlaying(null)} />;
  if (mini) return <MiniScreen which={mini} onExit={() => setMini(null)} />;
  return (
    <Lobby
      games={games}
      suite={suite}
      onSuite={setSuite}
      minis={MINIS.filter((m) => m.suite === suite)}
      onPlay={setPlaying}
      onMini={setMini}
      go={go}
    />
  );
}

/** one mini-game, full screen, with the same chrome as a scenario. */
function MiniScreen({ which, onExit }: { which: MiniKey; onExit: () => void }) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { answerIq } = useStore();
  const [earned, setEarned] = useState(0);
  const meta = MINIS.find((m) => m.key === which)!;

  // drills bank points the same way scenarios do, so one economy covers all four
  const score = (pts: number) => {
    setEarned((v) => v + pts);
    answerIq(pts > 0, pts);
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <View
        style={{
          paddingTop: insets.top + space.sm,
          paddingBottom: space.md,
          paddingHorizontal: space.gutter,
          flexDirection: 'row',
          alignItems: 'center',
          gap: space.md,
        }}
      >
        <IconButton icon="chevron-back" size={34} onPress={onExit} />
        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong">{meta.label}</Text>
          <Text variant="tab" tone="tertiary">
            {earned > 0 ? `+${earned} pts this session` : meta.blurb}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + space.xxxl, paddingTop: space.sm }}>
        {which === 'slip' && <SlipReflex onScore={score} />}
        {which === 'timing' && <TimingBar onScore={score} />}
        {which === 'catch' && <CatchDrill onScore={score} />}
        {which === 'purse' && <Selector onScore={score} />}
        {which === 'emoji' && <EmojiPuzzle onScore={score} />}
        {which === 'split' && <TheSplit onScore={score} />}
      </ScrollView>
    </View>
  );
}

/* ---------------------------------------------------------------- lobby */

function Lobby({
  games,
  suite,
  onSuite,
  minis,
  onPlay,
  onMini,
  go,
}: {
  games: IqGame[];
  suite: SuiteKey;
  onSuite: (s: SuiteKey) => void;
  minis: { key: string; label: string; blurb: string }[];
  onPlay: (g: IqGame) => void;
  onMini: (k: any) => void;
  go: (r: string) => void;
}) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { progression } = useStore();
  const league = leagueFor(progression.iqPoints);

  const today = games.filter((g) => g.group === 'daily');
  const rest = GROUP_ORDER.filter((g) => g !== 'daily').map((group) => ({
    group,
    list: games.filter((g) => g.group === group),
  }));

  const accuracy = progression.iqAnswered
    ? Math.round((progression.iqCorrect / progression.iqAnswered) * 100)
    : null;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.bg }}
      contentContainerStyle={{ paddingTop: insets.top + space.lg, paddingBottom: TAB_BAR_SPACE + insets.bottom + space.xl }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ paddingHorizontal: space.gutter, marginBottom: space.xl }}>
        <Text variant="display">game iq</Text>
      </View>

      {/* three numbers, evenly weighted — this replaces the cramped stat line */}
      <View style={{ paddingHorizontal: space.gutter, marginBottom: space.xxl }}>
        <Card padded={false}>
          <View style={{ flexDirection: 'row' }}>
            <Stat value={String(progression.streak)} label="day streak" tint={c.gold} icon="flame" />
            <Rule />
            <Stat value={accuracy === null ? '—' : `${accuracy}%`} label="accuracy" />
            <Rule />
            <Stat value={league.label} label={`${progression.iqPoints} pts`} tint={league.colour} />
          </View>
        </Card>
      </View>

      {/* suite picker */}
      <View style={{ marginBottom: space.xxl }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: space.gutter, gap: space.sm }}
        >
          {SUITES.map((s) => {
            const on = s.key === suite;
            return (
              <Touch
                key={s.key}
                haptic="selection"
                onPress={() => onSuite(s.key)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingHorizontal: space.lg,
                  height: 38,
                  borderRadius: radius.pill,
                  backgroundColor: on ? c.brand : c.fill,
                }}
              >
                <Ionicons name={s.icon} size={15} color={on ? c.textOnBrand : c.textSecondary} />
                <Text variant="callout" tone={on ? 'onBrand' : 'secondary'}>
                  {s.label}
                </Text>
              </Touch>
            );
          })}
        </ScrollView>
        <Text variant="caption" tone="tertiary" style={{ paddingHorizontal: space.gutter, marginTop: space.sm }}>
          {SUITES.find((s) => s.key === suite)!.blurb}
        </Text>
      </View>

      {suite !== 'decisions' && (
        <Section title={SUITES.find((s) => s.key === suite)!.label}>
          {minis.map((m) => (
            <Touch
              key={m.key}
              haptic="light"
              onPress={() => onMini(m.key)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: space.md,
                backgroundColor: c.surface,
                borderRadius: radius.md,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: c.hairline,
                padding: space.lg,
              }}
            >
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="bodyStrong">{m.label}</Text>
                <Text variant="caption" tone="secondary">
                  {m.blurb}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={15} color={c.textTertiary} />
            </Touch>
          ))}
        </Section>
      )}

      {/* today's two, given the space they deserve */}
      {suite === 'decisions' && (
        <>
      <Section title="today">
        {today.map((g) => (
          <Touch
            key={g.key}
            haptic="light"
            onPress={() => onPlay(g)}
            style={{
              backgroundColor: g.key === 'boss' ? c.brand : c.surface,
              borderRadius: radius.lg,
              borderWidth: g.key === 'boss' ? 0 : StyleSheet.hairlineWidth,
              borderColor: c.hairline,
              padding: space.xl,
              gap: space.sm,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
              <Ionicons
                name={g.key === 'boss' ? 'shield-checkmark' : 'refresh-circle'}
                size={15}
                color={g.key === 'boss' ? 'rgba(255,255,255,0.7)' : c.brand}
              />
              <Text variant="eyebrow" color={g.key === 'boss' ? 'rgba(255,255,255,0.7)' : c.brand}>
                {g.tag}
              </Text>
            </View>
            <Text variant="heading" tone={g.key === 'boss' ? 'onBrand' : 'primary'}>
              {g.label}
            </Text>
            <Text variant="callout" color={g.key === 'boss' ? 'rgba(255,255,255,0.78)' : c.textSecondary}>
              {g.blurb}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, marginTop: space.sm }}>
              <Meta icon="time-outline" label={`${g.timeLimit}s`} onBrand={g.key === 'boss'} />
              <Meta icon="trophy-outline" label={`${g.basePoints} pts`} onBrand={g.key === 'boss'} />
            </View>
          </Touch>
        ))}
      </Section>

      {rest.map(({ group, list }) =>
        list.length === 0 ? null : (
          <Section key={group} title={GROUP_LABELS[group]}>
            {list.map((g) => (
              <Touch
                key={g.key}
                haptic="light"
                onPress={() => onPlay(g)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: space.md,
                  backgroundColor: c.surface,
                  borderRadius: radius.md,
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: c.hairline,
                  padding: space.lg,
                }}
              >
                <View style={{ flex: 1, gap: 2 }}>
                  <Text variant="bodyStrong">{g.label}</Text>
                  <Text variant="caption" tone="secondary">
                    {g.blurb}
                  </Text>
                </View>
                <Text variant="tab" tone="tertiary">{`${g.timeLimit}s`}</Text>
                <Ionicons name="chevron-forward" size={15} color={c.textTertiary} />
              </Touch>
            ))}
          </Section>
        ),
      )}
        </>
      )}
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ paddingHorizontal: space.gutter, marginBottom: space.xxl }}>
      <Text variant="eyebrow" tone="tertiary" style={{ marginBottom: space.md }}>
        {title}
      </Text>
      <View style={{ gap: space.sm }}>{children}</View>
    </View>
  );
}

function Stat({ value, label, tint, icon }: { value: string; label: string; tint?: string; icon?: keyof typeof Ionicons.glyphMap }) {
  const c = useColors();
  return (
    <View style={{ flex: 1, alignItems: 'center', paddingVertical: space.lg, gap: 3 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        {icon && <Ionicons name={icon} size={14} color={tint ?? c.text} />}
        <Text style={{ fontFamily: font.black, fontSize: 19, letterSpacing: -0.6, color: tint ?? c.text }}>
          {value}
        </Text>
      </View>
      <Text variant="tab" tone="tertiary">
        {label}
      </Text>
    </View>
  );
}

function Rule() {
  const c = useColors();
  return <View style={{ width: StyleSheet.hairlineWidth, backgroundColor: c.hairline, marginVertical: space.md }} />;
}

function Meta({ icon, label, onBrand }: { icon: keyof typeof Ionicons.glyphMap; label: string; onBrand?: boolean }) {
  const c = useColors();
  const tint = onBrand ? 'rgba(255,255,255,0.7)' : c.textTertiary;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Ionicons name={icon} size={12} color={tint} />
      <Text variant="tab" color={tint}>
        {label}
      </Text>
    </View>
  );
}

/* ------------------------------------------------------------------ play */

function PlayScreen({ game, onExit }: { game: IqGame; onExit: () => void }) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { answerIq } = useStore();
  const [idx, setIdx] = useState(0);
  const [run, setRun] = useState({ answered: 0, correct: 0, pts: 0 });

  const item = game.items[idx % game.items.length];

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <View
        style={{
          paddingTop: insets.top + space.sm,
          paddingBottom: space.md,
          paddingHorizontal: space.gutter,
          flexDirection: 'row',
          alignItems: 'center',
          gap: space.md,
        }}
      >
        <IconButton icon="chevron-back" size={34} onPress={onExit} />
        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong" numberOfLines={1}>
            {game.label}
          </Text>
          <Text variant="tab" tone="tertiary">
            {run.answered === 0 ? game.tag : `${run.correct}/${run.answered} · +${run.pts} pts`}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + space.xxxl }}
        showsVerticalScrollIndicator={false}
      >
        <ScenarioCard
          key={`${game.key}-${idx}`}
          game={game}
          item={item}
          onResolved={(correct, pts) => {
            answerIq(correct, pts);
            setRun((r) => ({ answered: r.answered + 1, correct: r.correct + (correct ? 1 : 0), pts: r.pts + pts }));
          }}
          onNext={() => setIdx((v) => v + 1)}
        />
      </ScrollView>
    </View>
  );
}
