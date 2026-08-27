import React, { useMemo, useState } from 'react';
import { View, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Hud } from '../ui/Hud';
import { WeekStrip, type StripWeek } from '../ui/WeekStrip';
import { Text } from '../ui/Text';
import { Touch } from '../ui/Pressable';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Sheet } from '../ui/Sheet';
import { BatIcon, BallIcon } from '../ui/Icons';
import { useColors, space, radius, font, bandFor } from '../theme';
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
          <Card style={{ backgroundColor: c.brand, gap: space.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: space.md }}>
              <View style={{ flex: 1, gap: 3 }}>
                <Text variant="eyebrow" color="rgba(255,255,255,0.6)">
                  your goal
                </Text>
                <Text variant="heading" tone="onBrand">
                  {goal ? `${formatMetric(goal.to)} ${goal.unit}` : 'set a goal'}
                </Text>
                <Text variant="callout" color="rgba(255,255,255,0.78)" numberOfLines={2}>
                  {goal ? goalHeadline(goal) : 'pick a target and a date in your profile'}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontFamily: font.black, fontSize: 30, letterSpacing: -1.4, color: '#FFFFFF' }}>
                  {String(weeksLeft)}
                </Text>
                <Text variant="tab" color="rgba(255,255,255,0.7)">
                  {weeksLeft === 1 ? 'week left' : 'weeks left'}
                </Text>
              </View>
            </View>

            <View style={{ height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.22)', overflow: 'hidden' }}>
              <View
                style={{
                  height: '100%',
                  width: `${Math.round((doneWeeks / Math.max(1, plan.length)) * 100)}%`,
                  backgroundColor: '#FFFFFF',
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
            <Card style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
              <Ionicons name="arrow-forward-circle-outline" size={20} color={c.textTertiary} />
              <View style={{ flex: 1 }}>
                <Text variant="tab" tone="tertiary">
                  up next
                </Text>
                <Text variant="callout">{`week ${plan[currentIdx + 1].index} · ${plan[currentIdx + 1].focus}`}</Text>
              </View>
            </Card>
          </View>
        )}
      </ScrollView>

      {openWeek && <WeekSheet week={openWeek} onClose={() => setOpenWeek(null)} />}
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

      <Card padded={false} style={{ overflow: 'hidden' }}>
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
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: complete ? c.brand : c.fill,
                }}
              >
                <Ionicons
                  name={complete ? 'checkmark' : ACTION_ICON[a.id]}
                  size={18}
                  color={complete ? c.textOnBrand : c.textSecondary}
                />
              </View>

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
