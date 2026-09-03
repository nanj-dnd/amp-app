import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, ScrollView, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Hud } from '../ui/Hud';
import { WeekStrip, type StripWeek } from '../ui/WeekStrip';
import { Text } from '../ui/Text';
import { MetalFill, withAlpha } from '../ui/Metal';
import { Touch } from '../ui/Pressable';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Sheet } from '../ui/Sheet';
import { BatIcon, BallIcon } from '../ui/Icons';
import { useColors, space, radius, font, bandFor, METALS, metalGlow, springConfig, useReduceMotion } from '../theme';
import { TAB_BAR_SPACE } from '../ui/TabBar';
import { useStore } from '../state/store';
import { totalRuns, wickets, oversText } from '../match/engine';
import {
  buildPlan,
  weekProgress,
  currentWeekIndex,
  goalHeadline,
  countOf,
  weekKey,
  formatMetric,
  type PlanWeek,
  type ActionKind,
} from '../plan';

const ACTION_ICON: Record<ActionKind, keyof typeof Ionicons.glyphMap> = {
  record: 'videocam',
  iq: 'bulb',
  gym: 'barbell',
  nutrition: 'nutrition',
};

/**
 * home. the order is deliberate: what's live, then what you're chasing, then a
 * strip showing where you are on the way, then this week's actual work.
 * the work is the only thing you can act on, so it gets the most screen.
 */
export function RoadScreen({ go }: { go: (r: string) => void }) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { profile, progression, logAction, match } = useStore();
  const [openWeek, setOpenWeek] = useState<PlanWeek | null>(null);

  const plan = useMemo(() => buildPlan(profile, progression), [profile, progression]);
  const currentIdx = currentWeekIndex(plan);
  const current = plan[currentIdx];
  const goal = profile.goal;
  const weeksLeft = plan.length - currentIdx;

  const live = match.activeId ? match.matches.find((m) => m.id === match.activeId) : undefined;
  const liveInn = live?.innings[live.innings.length - 1];

  const strip: StripWeek[] = plan.map((w, i) => {
    const prog = weekProgress(w, progression);
    return {
      key: w.key,
      index: w.index,
      state: i < currentIdx || prog.complete ? 'done' : i === currentIdx ? 'current' : 'ahead',
      progress: prog.total ? prog.done / prog.total : 0,
      isMilestone: w.isMilestone,
    };
  });

  const doneWeeks = strip.filter((w) => w.state === 'done').length;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <Hud onScorePress={() => go('progress')} onAsk={() => go('ask')} />

      <ScrollView
        contentContainerStyle={{ paddingBottom: TAB_BAR_SPACE + insets.bottom + space.xxxl }}
        showsVerticalScrollIndicator={false}
      >
        {live && (
          <View style={{ paddingHorizontal: space.gutter, paddingTop: space.lg, paddingBottom: space.lg }}>
            <Card onPress={() => go(`match:${live.id}`)} style={{ borderColor: c.brandBorder, borderWidth: 1.5 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.score.poor }} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text variant="eyebrow" tone="tertiary">
                    live now
                  </Text>
                  <Text variant="bodyStrong" numberOfLines={1}>
                    {`${live.teams[0].name} v ${live.teams[1].name}`}
                  </Text>
                  {liveInn && (
                    <Text variant="caption" tone="secondary">
                      {`${totalRuns(liveInn)}/${wickets(liveInn)} (${oversText(liveInn)})`}
                    </Text>
                  )}
                </View>
                <Text variant="caption" tone="brand" style={{ fontFamily: font.bold }}>
                  resume
                </Text>
              </View>
            </Card>
          </View>
        )}

        {/* the destination, stated once */}
        <View style={{ paddingHorizontal: space.gutter, paddingTop: space.lg, paddingBottom: space.xl }}>
          {/* the one hero on this screen. it is struck metal, so its shadow is
              the light it throws rather than a grey smudge — the metals have
              carried a `glow` since they were written and nothing had ever
              spent it. */}
          <Card level="hero" style={[{ backgroundColor: METALS.brand.base, gap: space.md }, metalGlow('brand')]}>
            <MetalFill metal="brand" />
            {/* ink, not white: the lit half of a metal is too bright to carry
                white type, and white on metal is the thing that makes it look
                cheap everywhere else too */}
            <View style={{ gap: 3 }}>
              <Text variant="eyebrow" color={withAlpha(METALS.brand.ink, 0.62)}>
                your goal
              </Text>

              {/*
                the countdown used to be its own right-hand stack, top-aligned
                against a column that starts with an 11pt eyebrow. a 30pt
                numeral and an 11pt label have nothing in common at the top of
                their line boxes, so the number floated: its cap sat above "your
                goal" and its baseline landed between two lines on the left,
                touching neither.

                on one shared baseline the two halves finally read as one
                sentence — the goal, and how long is left to reach it — which is
                what the card is for.
              */}
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: space.sm }}>
                <Text variant="heading" color={METALS.brand.ink} style={{ flex: 1 }} numberOfLines={1}>
                  {goal ? `${formatMetric(goal.to)} ${goal.unit}` : 'set a goal'}
                </Text>
                <Text variant="scoreSm" color={METALS.brand.ink}>
                  {String(weeksLeft)}
                </Text>
                <Text variant="caption" color={withAlpha(METALS.brand.ink, 0.7)}>
                  {weeksLeft === 1 ? 'week left' : 'weeks left'}
                </Text>
              </View>

              <Text variant="callout" color={withAlpha(METALS.brand.ink, 0.8)} numberOfLines={2}>
                {goal ? goalHeadline(goal) : 'pick a target and a date in your profile'}
              </Text>
            </View>

            <View style={{ height: 6, borderRadius: 3, backgroundColor: withAlpha(METALS.brand.deep, 0.3), overflow: 'hidden' }}>
              <View
                style={{
                  height: '100%',
                  width: `${Math.round((doneWeeks / Math.max(1, plan.length)) * 100)}%`,
                  backgroundColor: METALS.brand.hi,
                  borderRadius: 3,
                }}
              />
            </View>

          </Card>
        </View>

        {/* the road itself, now a strip rather than a screen */}
        <View style={{ paddingBottom: space.xxl }}>
          <WeekStrip weeks={strip} onPick={(w) => setOpenWeek(plan.find((p) => p.key === w.key) ?? null)} />
        </View>

        {current && (
          <ThisWeek
            week={current}
            onAction={(id) => {
              if (id === 'record') return go('record');
              if (id === 'iq') return go('iq');
              if (id === 'gym') return go('gym');
              logAction(id);
            }}
          />
        )}

        {/* what the next block is pointed at, so the plan reads forward */}
        {plan[currentIdx + 1] && (
          <View style={{ paddingHorizontal: space.gutter, paddingTop: space.xl }}>
            <Card level="flat" style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
              <Ionicons name="arrow-forward-circle-outline" size={20} color={c.textTertiary} />
              <Text variant="callout" style={{ flex: 1 }} numberOfLines={1}>
                {`next · ${plan[currentIdx + 1].focus}`}
              </Text>
            </Card>
          </View>
        )}
      </ScrollView>

      {openWeek && <WeekSheet week={openWeek} onClose={() => setOpenWeek(null)} />}
    </View>
  );
}

/**
 * the disc on a weekly action, and the one completion beat in the loop.
 *
 * ticking something off is the whole reward for a week's work, and it used to
 * happen between two frames: the glyph was a checkmark, the disc was green, and
 * nothing marked the moment it changed. the mark springs in with a bounce it
 * has actually earned — this is a thing landing, not a panel being repositioned.
 *
 * it only fires on the *transition*. an action that was already complete when
 * the screen opened is history, not news, and a road full of discs popping on
 * every visit would say nothing at all.
 */
function Tick({ complete, icon }: { complete: boolean; icon: keyof typeof Ionicons.glyphMap }) {
  const c = useColors();
  const reduce = useReduceMotion();
  const s = useRef(new Animated.Value(1)).current;
  const was = useRef(complete);

  useEffect(() => {
    const justLanded = complete && !was.current;
    was.current = complete;
    if (!justLanded || reduce) return;
    s.setValue(0.6);
    Animated.spring(s, { toValue: 1, ...springConfig('flick') }).start();
  }, [complete, reduce, s]);

  return (
    <View
      style={{
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: complete ? METALS.brand.base : c.fill,
        overflow: 'hidden',
      }}
    >
      {complete && <MetalFill metal="brand" />}
      <Animated.View style={{ transform: [{ scale: s }] }}>
        <Ionicons
          name={complete ? 'checkmark' : icon}
          size={18}
          color={complete ? METALS.brand.ink : c.textSecondary}
        />
      </Animated.View>
    </View>
  );
}

function ThisWeek({ week, onAction }: { week: PlanWeek; onAction: (id: ActionKind) => void }) {
  const c = useColors();
  const { progression, profile } = useStore();
  const logged = progression.weekActions[weekKey()] ?? [];
  const required = week.actions.filter((a) => a.required);
  const doneCount = required.filter((a) => countOf(logged, a.id) >= a.target).length;

  return (
    <View style={{ paddingHorizontal: space.gutter, gap: space.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
        {profile.discipline === 'bowling' ? (
          <BallIcon size={17} color={c.textSecondary} />
        ) : (
          <BatIcon size={17} color={c.textSecondary} />
        )}
        <Text variant="heading" style={{ flex: 1 }} numberOfLines={1}>
          {`${week.label} · ${week.focus}`}
        </Text>
        <Text variant="caption" tone="tertiary" style={{ fontFamily: font.bold }}>
          {`${doneCount}/${required.length}`}
        </Text>
      </View>

      <Card padded={false} level="flat" style={{ overflow: 'hidden' }}>
        {week.actions.map((a, i) => {
          const n = countOf(logged, a.id);
          const complete = n >= a.target;
          return (
            <Touch
              key={a.id}
              scale={false}
              haptic="selection"
              onPress={() => onAction(a.id)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: space.md,
                paddingHorizontal: space.xl,
                paddingVertical: space.lg,
                borderTopWidth: i === 0 ? 0 : 1,
                borderTopColor: c.hairline,
              }}
            >
              <Tick complete={complete} icon={ACTION_ICON[a.id]} />

              <View style={{ flex: 1, gap: 1 }}>
                <Text variant="bodyStrong">{a.label}</Text>
                <Text variant="caption" tone="secondary">
                  {a.detail}
                </Text>
              </View>

              {a.target > 1 && (
                <Text variant="caption" tone={complete ? 'brand' : 'tertiary'} style={{ fontFamily: font.bold }}>
                  {`${Math.min(n, a.target)}/${a.target}`}
                </Text>
              )}
              {!complete && <Ionicons name="chevron-forward" size={15} color={c.textTertiary} />}
            </Touch>
          );
        })}
      </Card>
    </View>
  );
}

function WeekSheet({ week, onClose }: { week: PlanWeek; onClose: () => void }) {
  return (
    <Sheet onClose={onClose}>
      <View style={{ gap: space.sm }}>
        <Text variant="eyebrow" tone="tertiary">
          {week.label}
        </Text>
        <Text variant="title">{week.focus}</Text>
        <Text variant="callout" tone="secondary">
          {`checkpoint: amp score ${week.checkpoint}. ${
            week.isMilestone ? 'this week closes the block with a review.' : 'film one session and the report points here.'
          }`}
        </Text>
      </View>
      <Button label="close" kind="secondary" full onPress={onClose} />
    </Sheet>
  );
}
