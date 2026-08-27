import React, { useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Section } from '../ui/Screen';
import { Card, Divider } from '../ui/Card';
import { Text } from '../ui/Text';
import { Touch } from '../ui/Pressable';
import { ScoreRing, Bar } from '../ui/Score';
import { StatTile, TileRow, EmptyState } from '../ui/Bits';
import { SessionCard } from '../ui/SessionCard';
import { SectionChart } from '../ui/SectionChart';
import { ScoringAreas } from '../ui/ScoringAreas';
import { Segmented } from '../ui/Segmented';
import { Button, IconButton } from '../ui/Button';
import { LineChart } from '../ui/Chart';
import { SeriesChart, type Series } from '../ui/SeriesChart';
import { useColors, space, radius, font, bandFor } from '../theme';
import { useStore } from '../state/store';
import { rescale, tierFor, type SectionResult } from '../kpis';
import { matchInsights, scoringAreas, scoredMatches, myMatches, MIN_BALLS } from '../insights';
import { totalRuns, wickets, oversText, teamById } from '../match/engine';
import {
  scoreHistory,
  deliveries,
  sessionScores,
  previousScores,
  sectionBenchmarks,
  sectionHistory,
  sectionColours,
  sessions as seed,
} from '../data';

type View3 = 'overview' | 'technique' | 'spell' | 'matches';

export function ProgressScreen({ go, onClose }: { go: (r: string) => void; onClose?: () => void }) {
  const { profile } = useStore();
  const [view, setView] = useState<View3>('overview');
  // ball by ball reads a spell, so it only exists for someone who bowls
  const bowls = profile.discipline !== 'batting';

  return (
    <Screen title="progress" onBack={onClose}>
      <Section>
        <Segmented
          size="sm"
          value={view}
          onChange={setView}
          options={[
            { value: 'overview', label: 'overview' },
            { value: 'technique', label: 'technique' },
            ...(bowls ? [{ value: 'spell' as const, label: 'ball by ball' }] : []),
            { value: 'matches', label: 'matches' },
          ]}
        />
      </Section>

      {view === 'overview' && <Overview go={go} />}
      {view === 'technique' && <Technique />}
      {view === 'spell' && bowls && <Spell />}
      {view === 'matches' && <Matches go={go} />}
    </Screen>
  );
}

/* -------------------------------------------------------------- overview */

function Overview({ go }: { go: (r: string) => void }) {
  const c = useColors();
  const { progression, profile } = useStore();
  const [range, setRange] = useState<'30d' | '90d' | 'all'>('30d');
  const [list, setList] = useState(seed);

  const rated = progression.ampScore > 0;
  if (!rated)
    return (
      <Section>
        <Card>
          <EmptyState
            icon="videocam-outline"
            title="nothing scored yet"
            body="film one session and your amp score starts here."
            action={<Button label="film a session" icon="add" onPress={() => go('record')} />}
          />
        </Card>
      </Section>
    );

  const series = range === '30d' ? scoreHistory.slice(-14) : range === '90d' ? scoreHistory.slice(-24) : scoreHistory;
  const latest = progression.ampScore;
  const prev = scoreHistory[scoreHistory.length - 2];
  const best = Math.max(...scoreHistory);

  return (
    <>
      <Section>
        <Card style={{ alignItems: 'center', paddingVertical: space.xxl }}>
          <ScoreRing value={latest} caption="amp score" />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: space.lg }}>
            <Ionicons name={latest >= prev ? 'arrow-up' : 'arrow-down'} size={13} color={latest >= prev ? c.score.good : c.score.poor} />
            <Text variant="callout" color={latest >= prev ? c.score.good : c.score.poor}>
              {`${(latest - prev).toFixed(1)} vs last session`}
            </Text>
          </View>
        </Card>
      </Section>

      <Section gap={space.md}>
        <TileRow>
          <StatTile value={String(list.length)} label="sessions" />
          <StatTile value={String(best)} label="best" tone={c.score.good} />
        </TileRow>
        <TileRow>
          <StatTile value={String(progression.streak)} label="day streak" tone={c.gold} />
          <StatTile value={String(progression.iqPoints)} label="iq points" tone={c.brand} />
        </TileRow>
      </Section>

      <Section title="score over time" action={
        <View style={{ width: 148 }}>
          <Segmented
            size="sm"
            value={range}
            onChange={setRange}
            options={[
              { value: '30d', label: '30d' },
              { value: '90d', label: '90d' },
              { value: 'all', label: 'all' },
            ]}
          />
        </View>
      }>
        <Card>
          <LineChart data={series} labels={['jul 2', 'jul 20', 'aug 26']} />
        </Card>
      </Section>

      <Section title="sessions">
        {list.map((s) => (
          <SessionCard
            key={s.id}
            player={profile.name || 'you'}
            kind={s.kind}
            when={s.when}
            score={s.score}
            onDelete={() => setList((l) => l.filter((x) => x.id !== s.id))}
          />
        ))}
      </Section>
    </>
  );
}

/* ------------------------------------------------------------- technique */

/**
 * the scored sheet, as the sheet is actually built: weighted sections, weighted
 * kpis inside them, and blanks that stay blank. everything is normalised to
 * 0–100 so a 20-point section and a 10-point one can sit on the same axis.
 */
function Technique() {
  const c = useColors();
  const { profile } = useStore();
  const [mode, setMode] = useState<'pace' | 'spin'>('pace');
  const [open, setOpen] = useState<string | null>(null);

  const tier = tierFor(profile.ageYears, mode);
  const now = useMemo(() => rescale(sessionScores, tier), [tier]);
  const before = useMemo(() => rescale(previousScores, tier), [tier]);
  const bench = sectionBenchmarks[profile.level] ?? 58;

  const adult = profile.ageYears >= 15;

  // one series per section of the sheet, coloured consistently
  const series: Series[] = useMemo(
    () =>
      now.sections
        .filter((s) => sectionHistory[s.section.id])
        .map((s) => ({
          id: s.section.id,
          label: s.section.name.replace(/ \(.*\)$/, '').replace('footwork: ', '').replace(' deliveries only', ''),
          colour: sectionColours[s.section.id] ?? c.textSecondary,
          points: sectionHistory[s.section.id],
        })),
    [now.sections, c.textSecondary],
  );
  const weakest = now.sections
    .filter((s) => s.score !== null)
    .sort((a, b) => (a.score ?? 0) - (b.score ?? 0))[0];

  return (
    <>
      <Section>
        <Card style={{ gap: space.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
            <View style={{ flex: 1 }}>
              <Text variant="eyebrow" tone="tertiary">
                {`${now.tier.label} sheet · ${now.tier.ages}`}
              </Text>
              <Text variant="title">{now.overall === null ? '—' : String(now.overall)}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text variant="tab" tone="tertiary">
                observed
              </Text>
              <Text variant="callout" style={{ fontFamily: font.bold }}>
                {`${now.observed}/${now.possible} pts`}
              </Text>
            </View>
          </View>

          {/* the blank-vs-zero rule, said once where it matters */}
          <Text variant="caption" tone="secondary">
            {now.observed < now.possible
              ? `rescaled over what was visible — ${now.possible - now.observed} points of the sheet weren't in this session.`
              : 'every kpi on the sheet was scorable in this session.'}
          </Text>
        </Card>
      </Section>

      {adult && (
        <Section>
          <Segmented
            size="sm"
            value={mode}
            onChange={setMode}
            options={[
              { value: 'pace', label: 'vs pace' },
              { value: 'spin', label: 'vs spin' },
            ]}
          />
        </Section>
      )}

      <Section title="sections" action={<Text variant="caption" tone="tertiary">{`vs ${profile.level}`}</Text>}>
        <Card>
          <SectionChart sections={now.sections} benchmark={bench} />
        </Card>
      </Section>

      <Section title="sections over time">
        <Card>
          <SeriesChart series={series} labels={['s1', 's6', 's12']} />
        </Card>
      </Section>

      {weakest && (
        <Section>
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, borderColor: c.brandBorder, borderWidth: 1.5 }}>
            <Ionicons name="locate-outline" size={20} color={c.brand} />
            <View style={{ flex: 1 }}>
              <Text variant="tab" tone="brand">
                priority
              </Text>
              <Text variant="callout">{`${weakest.section.name} · ${weakest.score}`}</Text>
            </View>
          </Card>
        </Section>
      )}

      <Section title="every kpi">
        <Card padded={false}>
          {now.sections.map((s, i) => (
            <SectionRows
              key={s.section.id}
              result={s}
              previous={before.sections.find((x) => x.section.id === s.section.id)}
              first={i === 0}
              open={open === s.section.id}
              onToggle={() => setOpen(open === s.section.id ? null : s.section.id)}
            />
          ))}
        </Card>
      </Section>

    </>
  );
}

function SectionRows({
  result,
  previous,
  first,
  open,
  onToggle,
}: {
  result: SectionResult;
  previous?: SectionResult;
  first: boolean;
  open: boolean;
  onToggle: () => void;
}) {
  const c = useColors();
  const delta = result.score !== null && previous?.score != null ? result.score - previous.score : null;

  return (
    <View>
      {!first && <Divider />}
      <Touch
        scale={false}
        haptic="selection"
        onPress={onToggle}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: space.md,
          paddingHorizontal: space.xl,
          paddingVertical: space.lg,
          backgroundColor: open ? c.brandTint : 'transparent',
        }}
      >
        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong" numberOfLines={1}>
            {result.section.name}
          </Text>
          <Text variant="tab" tone="tertiary">
            {`${result.scored}/${result.total} scored`}
          </Text>
        </View>
        {delta !== null && delta !== 0 && (
          <Text variant="caption" color={delta > 0 ? c.score.good : c.score.poor}>
            {`${delta > 0 ? '+' : ''}${delta}`}
          </Text>
        )}
        <Text
          variant="bodyStrong"
          color={result.score === null ? c.textTertiary : c.score[bandFor(result.score)]}
          style={{ width: 30, textAlign: 'right' }}
        >
          {result.score === null ? '—' : String(result.score)}
        </Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={15} color={c.textTertiary} />
      </Touch>

      {open && (
        <View style={{ paddingHorizontal: space.xl, paddingBottom: space.lg, gap: space.md }}>
          {result.kpis.map((k) => (
            <View key={k.kpi.id} style={{ gap: 5, opacity: k.score === null ? 0.45 : 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: space.sm }}>
                <Text variant="caption" style={{ flex: 1 }}>
                  {k.kpi.name}
                </Text>
                {k.kpi.applies !== 'both' && (
                  <Text variant="tab" tone="tertiary">
                    {k.kpi.applies}
                  </Text>
                )}
                <Text variant="caption" style={{ fontFamily: font.bold }}>
                  {k.score === null ? '—' : `${k.score}/10`}
                </Text>
              </View>
              <Bar value={k.score === null ? 0 : k.score * 10} />
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

/**
 * a spell, delivery by delivery. this is a bowling read — it describes what the
 * bowler did with each ball — so it is its own view rather than a strip inside
 * the batting sheet, and it doesn't exist for a pure batter.
 */
function Spell() {
  const c = useColors();
  const [open, setOpen] = useState<number | null>(null);
  const avg = Math.round(deliveries.reduce((s, d) => s + d.score, 0) / deliveries.length);
  const worst = deliveries.reduce((a, b) => (a.score <= b.score ? a : b));

  return (
    <Section title="this spell">
      <Card style={{ gap: space.lg }}>
        <Text variant="caption" tone="secondary">
          {`${deliveries.length} deliveries · avg ${avg}`}
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: space.sm, height: 128 }}>
          {deliveries.map((d) => {
            const on = open === d.id;
            return (
              <Touch
                key={d.id}
                haptic="selection"
                onPress={() => setOpen(on ? null : d.id)}
                style={{ flexGrow: 1, flexBasis: 0, minWidth: 0, alignItems: 'center', gap: 5 }}
              >
                <View
                  style={{
                    width: '100%',
                    height: Math.max(8, (d.score / 100) * 100),
                    borderRadius: radius.sm,
                    backgroundColor: c.score[bandFor(d.score)],
                    opacity: open === null || on ? 1 : 0.4,
                  }}
                />
                <Text variant="tab" tone={on ? 'brand' : 'tertiary'}>
                  {String(d.id)}
                </Text>
              </Touch>
            );
          })}
        </View>

        <View
          style={{
            padding: space.md,
            borderRadius: radius.sm,
            backgroundColor: c.fill,
            flexDirection: 'row',
            alignItems: 'center',
            gap: space.sm,
          }}
        >
          <Ionicons name="information-circle-outline" size={16} color={c.textSecondary} />
          <Text variant="caption" tone="secondary" style={{ flex: 1 }}>
            {open
              ? `ball ${open} · ${deliveries.find((d) => d.id === open)!.score} — ${deliveries.find((d) => d.id === open)!.note}`
              : `weakest was ball ${worst.id} — ${worst.note}`}
          </Text>
        </View>
      </Card>
    </Section>
  );
}

/* --------------------------------------------------------------- matches */

function Matches({ go }: { go: (r: string) => void }) {
  const c = useColors();
  const { match, profile } = useStore();
  const all = scoredMatches(match.matches);
  const mine = myMatches(match.matches);
  const areas = scoringAreas(mine);
  const plotted = areas.reduce((s, a) => s + a.runs, 0);
  const insights = matchInsights(match.matches, profile.discipline);
  const untagged = all.length - mine.length;

  if (all.length === 0)
    return (
      <Section>
        <Card>
          <EmptyState
            icon="stopwatch-outline"
            title="no matches yet"
            body="score one and mark which player is you."
            action={<Button label="score a match" icon="add" onPress={() => go('match')} />}
          />
        </Card>
      </Section>
    );

  return (
    <>
      <Section>
        {all.map((m) => {
          const last = m.innings[m.innings.length - 1];
          return (
            <Card key={m.id} onPress={() => go(`match:${m.id}`)} style={{ gap: 5 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
                <Text variant="bodyStrong" style={{ flex: 1 }} numberOfLines={1}>
                  {`${m.teams[0].name} v ${m.teams[1].name}`}
                </Text>
                {m.status === 'live' && <Pill label="live" tone={c.score.poor} />}
                {m.athletePlayerId && <Pill label="you" tone={c.brand} />}
              </View>
              <Text variant="caption" tone="secondary">
                {m.result ??
                  `${teamById(m, last.battingTeamId).name} ${totalRuns(last)}/${wickets(last)} (${oversText(last)})`}
              </Text>
            </Card>
          );
        })}
      </Section>

      {untagged > 0 && (
        <Section>
          <Text variant="caption" tone="tertiary">
            {`${untagged} of these ${untagged === 1 ? 'has' : 'have'} nobody marked as you, so ${untagged === 1 ? "it doesn't" : "they don't"} feed your kpis.`}
          </Text>
        </Section>
      )}

      {plotted > 0 && (
        <Section title="where your runs go">
          <Card style={{ paddingVertical: space.xxl }}>
            <ScoringAreas areas={areas} />
          </Card>
        </Section>
      )}

      <Section title="from your matches">
        {insights.length === 0 ? (
          <Card>
            <Text variant="caption" tone="secondary">
              {`${MIN_BALLS} balls of evidence needed before these mean anything.`}
            </Text>
          </Card>
        ) : (
          <Card padded={false}>
            {insights.map((k, i) => (
              <View key={k.name}>
                {i > 0 && <Divider inset={space.xl} />}
                <View style={{ paddingHorizontal: space.xl, paddingVertical: space.lg, gap: space.sm }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
                    <Text variant="bodyStrong" style={{ flex: 1 }}>
                      {k.name}
                    </Text>
                    <Text variant="bodyStrong" color={c.score[bandFor(k.score)]}>
                      {String(k.score)}
                    </Text>
                  </View>
                  <Bar value={k.score} />
                  <Text variant="tab" tone="tertiary">
                    {k.detail}
                  </Text>
                </View>
              </View>
            ))}
          </Card>
        )}
      </Section>
    </>
  );
}

function Pill({ label, tone }: { label: string; tone: string }) {
  return (
    <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.sm, backgroundColor: tone + '22' }}>
      <Text variant="tab" color={tone}>
        {label}
      </Text>
    </View>
  );
}
