import React, { useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../../ui/Text';
import { Touch } from '../../ui/Pressable';
import { Card, Divider } from '../../ui/Card';
import { IconButton } from '../../ui/Button';
import { ScoreDial } from '../../ui/ScoreDial';
import { Sheet } from '../../ui/Sheet';
import { useColors, space, radius, font, bandFor } from '../../theme';
import {
  resultOf,
  kpiIndex,
  tierOf,
  ratingOf,
  movers,
  scoredCount,
  riskOf,
  type Report,
  type Rating,
  type Drill,
  type ScreenFinding,
  type RiskLevel,
} from '../../report';
import { currentReport, previousReport } from '../../reportData';

type Tab = 'summary' | 'ratings' | 'video';

const TABS: { key: Tab; label: string }[] = [
  { key: 'summary', label: 'summary' },
  { key: 'ratings', label: 'ratings' },
  { key: 'video', label: 'video' },
];

/**
 * the report, reorganised.
 *
 * it used to be four tabs where the first was six unrelated cards stacked in a
 * scroll, and the second put a paragraph under all nineteen kpi rows. so the
 * whole thing read as one long undifferentiated column.
 *
 * now it reads in the order the questions get asked:
 *   summary   what's the number, what's the risk, what do i do about it
 *   ratings   every kpi, collapsed until you ask for one
 *   video     the clip and the frames the reads came from
 * chat moved to the header, where it is on every other screen.
 */
export function ReportScreen({
  onClose,
  report = currentReport,
  onAsk,
}: {
  onClose: () => void;
  report?: Report;
  onAsk?: () => void;
}) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('summary');
  const [openKpi, setOpenKpi] = useState<string | null>(null);
  const [openDrill, setOpenDrill] = useState<Drill | null>(null);
  const [openRisk, setOpenRisk] = useState(false);

  const tier = tierOf(report);
  const index = useMemo(() => kpiIndex(tier), [tier]);
  const result = useMemo(() => resultOf(report), [report]);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <View
        style={{
          paddingTop: insets.top + space.sm,
          paddingHorizontal: space.gutter,
          flexDirection: 'row',
          alignItems: 'center',
          gap: space.sm,
          backgroundColor: c.surface,
        }}
      >
        <IconButton icon="chevron-back" size={34} onPress={onClose} />
        <Text variant="heading" style={{ flex: 1 }}>
          report
        </Text>
        <Text variant="caption" tone="tertiary">
          {report.date}
        </Text>
        {onAsk && <IconButton icon="chatbubble-ellipses-outline" size={34} onPress={onAsk} />}
      </View>

      <View
        style={{
          flexDirection: 'row',
          paddingHorizontal: space.gutter,
          backgroundColor: c.surface,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: c.hairline,
        }}
      >
        {TABS.map((t) => {
          const on = tab === t.key;
          return (
            <Touch
              key={t.key}
              haptic="selection"
              onPress={() => setTab(t.key)}
              style={{
                flexGrow: 1,
                flexBasis: 0,
                alignItems: 'center',
                paddingVertical: space.md,
                borderBottomWidth: 2,
                borderBottomColor: on ? c.brand : 'transparent',
              }}
            >
              <Text variant="callout" tone={on ? 'brand' : 'secondary'} style={on ? { fontFamily: font.bold } : null}>
                {t.label}
              </Text>
            </Touch>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={{ padding: space.gutter, paddingBottom: insets.bottom + space.xxxl, gap: space.md }}
        showsVerticalScrollIndicator={false}
      >
        {tab === 'summary' && (
          <Summary
            report={report}
            index={index}
            result={result}
            onKpi={setOpenKpi}
            onDrill={setOpenDrill}
            onRisk={() => setOpenRisk(true)}
          />
        )}
        {tab === 'ratings' && <Ratings report={report} result={result} onOpen={setOpenKpi} />}
        {tab === 'video' && <VideoTab report={report} index={index} onOpen={setOpenKpi} />}
      </ScrollView>

      {openKpi && (
        <KpiSheet rating={ratingOf(report, openKpi)!} meta={index.get(openKpi)!} onClose={() => setOpenKpi(null)} />
      )}
      {openDrill && <DrillSheet drill={openDrill} onClose={() => setOpenDrill(null)} />}
      {openRisk && <RiskSheet findings={report.screening} onClose={() => setOpenRisk(false)} />}
    </View>
  );
}

/* --------------------------------------------------------------- summary */

function Summary({
  report,
  index,
  result,
  onKpi,
  onDrill,
  onRisk,
}: {
  report: Report;
  index: ReturnType<typeof kpiIndex>;
  result: ReturnType<typeof resultOf>;
  onKpi: (id: string) => void;
  onDrill: (d: Drill) => void;
  onRisk: () => void;
}) {
  const c = useColors();
  const moved = movers(report, previousReport);
  const last = report.history[report.history.length - 1];
  const prev = report.history[report.history.length - 2];
  const up = last >= prev;
  const risk = riskOf(report);
  const flagged = report.screening.filter((f) => f.level !== 'clear');

  const priorityMeta = index.get(report.priorityId);
  const strengthMeta = index.get(report.strengthId);

  return (
    <>
      {/* the number, the trend and the coverage — one card, not three */}
      <Card style={{ alignItems: 'center', paddingVertical: space.xl, gap: space.lg }}>
        <ScoreDial value={result.overall ?? 0} size={186} />

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
          <Ionicons name={up ? 'caret-up' : 'caret-down'} size={13} color={up ? c.score.good : c.score.poor} />
          <Text variant="callout" color={up ? c.score.good : c.score.poor} style={{ fontFamily: font.bold }}>
            {`${up ? '+' : ''}${(last - prev).toFixed(1)}`}
          </Text>
          <Text variant="caption" tone="tertiary">
            {`vs last · ${scoredCount(report)}/${report.ratings.length} kpis`}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 5, alignSelf: 'stretch', height: 42 }}>
          {report.history.map((h, i) => {
            const now = i === report.history.length - 1;
            return (
              <View
                key={i}
                style={{
                  flexGrow: 1,
                  flexBasis: 0,
                  height: Math.max(6, (h / 100) * 40),
                  borderRadius: 3,
                  backgroundColor: now ? c.score[bandFor(h)] : c.fillStrong,
                }}
              />
            );
          })}
        </View>
      </Card>

      {/* risk is read differently from a low score, so it gets its own card */}
      {flagged.length > 0 && (
        <Card onPress={onRisk} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
          <RiskDot level={risk} />
          <View style={{ flex: 1, gap: 1 }}>
            <Text variant="tab" tone="tertiary">
              injury screening
            </Text>
            <Text variant="callout" numberOfLines={1}>
              {flagged.map((f) => f.area).join(', ')}
            </Text>
          </View>
          <Text variant="caption" tone="secondary">
            {risk === 'flag' ? 'action needed' : 'watch'}
          </Text>
          <Ionicons name="chevron-forward" size={15} color={c.textTertiary} />
        </Card>
      )}

      {/* the actionable unit: what's wrong, and the work that fixes it */}
      <Card padded={false}>
        <Touch
          scale={false}
          haptic="selection"
          onPress={() => onKpi(report.priorityId)}
          style={{ padding: space.xl, gap: space.sm }}
        >
          <Text variant="eyebrow" color={c.score.poor}>
            fix this week
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
            <Text variant="heading" style={{ flex: 1 }}>
              {priorityMeta?.name}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={c.textTertiary} />
          </View>
          <Text variant="callout" tone="secondary">
            {report.notes}
          </Text>
        </Touch>

        <Divider />

        {report.drills.map((d, i) => (
          <View key={d.name}>
            {i > 0 && <Divider inset={space.xl} />}
            <Touch
              scale={false}
              haptic="selection"
              onPress={() => onDrill(d)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.xl, paddingVertical: space.lg }}
            >
              <View
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  backgroundColor: c.brandTint,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text variant="tab" tone="brand" style={{ fontFamily: font.black }}>
                  {String(i + 1)}
                </Text>
              </View>
              <View style={{ flex: 1, gap: 1 }}>
                <Text variant="bodyStrong">{d.name}</Text>
                <Text variant="caption" tone="tertiary">
                  {d.cue}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={15} color={c.textTertiary} />
            </Touch>
          </View>
        ))}
      </Card>

      {/* strength gets a line, not a card — it isn't the thing you act on */}
      <Card onPress={() => onKpi(report.strengthId)} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
        <Ionicons name="checkmark-circle" size={20} color={c.score.good} />
        <View style={{ flex: 1, gap: 1 }}>
          <Text variant="tab" tone="tertiary">
            working well
          </Text>
          <Text variant="callout" numberOfLines={1}>
            {strengthMeta?.name}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={15} color={c.textTertiary} />
      </Card>

      <Card style={{ gap: space.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text variant="eyebrow" tone="tertiary" style={{ flex: 1 }}>
            sections
          </Text>
          {moved.length > 0 && (
            <Text variant="tab" tone="tertiary">
              {`${moved.filter((m) => m.delta > 0).length} up · ${moved.filter((m) => m.delta < 0).length} down`}
            </Text>
          )}
        </View>

        {result.sections.map((s) => {
          const mv = moved.find((m) => m.name === s.section.name);
          return (
            <View key={s.section.id} style={{ gap: 5, opacity: s.score === null ? 0.4 : 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: space.sm }}>
                <Text variant="callout" style={{ flex: 1 }} numberOfLines={1}>
                  {s.section.name}
                </Text>
                {mv && (
                  <Text variant="tab" color={mv.delta > 0 ? c.score.good : c.score.poor}>
                    {`${mv.delta > 0 ? '+' : ''}${mv.delta}`}
                  </Text>
                )}
                <Text
                  variant="bodyStrong"
                  color={s.score === null ? c.textTertiary : c.score[bandFor(s.score)]}
                  style={{ width: 28, textAlign: 'right' }}
                >
                  {s.score === null ? '—' : String(s.score)}
                </Text>
              </View>
              <View style={{ height: 6, borderRadius: 3, backgroundColor: c.fill }}>
                {s.score !== null && (
                  <View
                    style={{
                      height: '100%',
                      width: `${Math.max(2, s.score)}%`,
                      borderRadius: 3,
                      backgroundColor: c.score[bandFor(s.score)],
                    }}
                  />
                )}
              </View>
            </View>
          );
        })}
      </Card>
    </>
  );
}

function RiskDot({ level }: { level: RiskLevel }) {
  const c = useColors();
  const tone = level === 'flag' ? c.score.poor : level === 'watch' ? c.score.fair : c.score.good;
  return (
    <View
      style={{
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: tone + '22',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons name={level === 'clear' ? 'shield-checkmark' : 'warning'} size={17} color={tone} />
    </View>
  );
}

/* --------------------------------------------------------------- ratings */

/**
 * every kpi, collapsed. the old version printed the observation under all
 * nineteen rows at once, which is four screens of prose you have to scroll past
 * to compare two numbers. the numbers are the list; the prose is one tap away.
 */
function Ratings({
  report,
  result,
  onOpen,
}: {
  report: Report;
  result: ReturnType<typeof resultOf>;
  onOpen: (id: string) => void;
}) {
  const c = useColors();
  const [open, setOpen] = useState<string | null>(result.sections.find((s) => s.score !== null)?.section.id ?? null);

  return (
    <Card padded={false}>
      {result.sections.map((s, i) => {
        const expanded = open === s.section.id;
        return (
          <View key={s.section.id}>
            {i > 0 && <Divider />}
            <Touch
              scale={false}
              haptic="selection"
              onPress={() => setOpen(expanded ? null : s.section.id)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: space.md,
                paddingHorizontal: space.xl,
                paddingVertical: space.lg,
                backgroundColor: expanded ? c.brandTint : 'transparent',
              }}
            >
              <View style={{ flex: 1, gap: 1 }}>
                <Text variant="bodyStrong" numberOfLines={1}>
                  {s.section.name}
                </Text>
                <Text variant="tab" tone="tertiary">
                  {`${s.section.pts}pts · ${s.scored}/${s.total} scored`}
                </Text>
              </View>
              <Text
                variant="bodyStrong"
                color={s.score === null ? c.textTertiary : c.score[bandFor(s.score)]}
              >
                {s.score === null ? '—' : String(s.score)}
              </Text>
              <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={15} color={c.textTertiary} />
            </Touch>

            {expanded &&
              s.kpis.map((k) => {
                const out = k.score === null;
                const pct = k.score === null ? 0 : k.score * 10;
                return (
                  <Touch
                    key={k.kpi.id}
                    scale={false}
                    haptic={out ? false : 'selection'}
                    onPress={() => !out && onOpen(k.kpi.id)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: space.md,
                      paddingLeft: space.xl,
                      paddingRight: space.lg,
                      paddingVertical: space.md,
                      opacity: out ? 0.45 : 1,
                    }}
                  >
                    <View style={{ flex: 1, gap: 5 }}>
                      <Text variant="callout" numberOfLines={1}>
                        {k.kpi.name}
                      </Text>
                      <View style={{ height: 5, borderRadius: 3, backgroundColor: c.fill }}>
                        {!out && (
                          <View
                            style={{
                              height: '100%',
                              width: `${Math.max(2, pct)}%`,
                              borderRadius: 3,
                              backgroundColor: c.score[bandFor(pct)],
                            }}
                          />
                        )}
                      </View>
                    </View>
                    <Text
                      variant="callout"
                      color={out ? c.textTertiary : c.score[bandFor(pct)]}
                      style={{ fontFamily: font.bold, width: 26, textAlign: 'right' }}
                    >
                      {out ? '—' : String(pct)}
                    </Text>
                    <Ionicons name="chevron-forward" size={13} color={out ? 'transparent' : c.textTertiary} />
                  </Touch>
                );
              })}
          </View>
        );
      })}
    </Card>
  );
}

/* ----------------------------------------------------------------- sheets */

function KpiSheet({
  rating,
  meta,
  onClose,
}: {
  rating: Rating;
  meta: { name: string; pts: number; section: string };
  onClose: () => void;
}) {
  const c = useColors();
  const out = rating.score === null;

  return (
    <Sheet onClose={onClose} scroll>
      <View style={{ gap: 2 }}>
        <Text variant="eyebrow" tone="tertiary">
          {meta.section}
        </Text>
        <Text variant="title">{meta.name}</Text>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3 }}>
          <Text
            style={{
              fontFamily: font.black,
              fontSize: 38,
              lineHeight: 42,
              letterSpacing: -1.8,
              color: out ? c.textTertiary : c.score[bandFor((rating.score ?? 0) * 10)],
            }}
          >
            {out ? '—' : rating.score!.toFixed(1)}
          </Text>
          <Text variant="heading" tone="tertiary">
            /10
          </Text>
        </View>
        <View style={{ flex: 1 }} />
        {rating.view && <Tag label={`${rating.view} view`} />}
        <Tag label={`${meta.pts}pts`} brand />
      </View>

      <Text variant="body" preserveCase style={{ lineHeight: 24 }}>
        {rating.observation}
      </Text>

      {rating.evidence && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: space.sm,
            padding: space.md,
            borderRadius: radius.md,
            backgroundColor: c.fill,
          }}
        >
          <Ionicons name="film-outline" size={17} color={c.textSecondary} />
          <Text variant="callout" style={{ flex: 1 }}>
            {rating.evidence}
          </Text>
          <Text variant="caption" tone="brand">
            open
          </Text>
        </View>
      )}
    </Sheet>
  );
}

function DrillSheet({ drill, onClose }: { drill: Drill; onClose: () => void }) {
  return (
    <Sheet onClose={onClose}>
      <View style={{ gap: 2 }}>
        <Text variant="eyebrow" tone="tertiary">
          drill
        </Text>
        <Text variant="title">{drill.name}</Text>
      </View>
      <Text variant="body" preserveCase style={{ lineHeight: 24 }}>
        {drill.how}
      </Text>
    </Sheet>
  );
}

function RiskSheet({ findings, onClose }: { findings: ScreenFinding[]; onClose: () => void }) {
  const c = useColors();
  return (
    <Sheet onClose={onClose} scroll>
      <View style={{ gap: 2 }}>
        <Text variant="title">injury screening</Text>
        <Text variant="caption" tone="secondary">
          load and movement patterns, not technique quality.
        </Text>
      </View>

      <View style={{ gap: space.sm }}>
        {findings.map((f) => {
          const tone = f.level === 'flag' ? c.score.poor : f.level === 'watch' ? c.score.fair : c.score.good;
          return (
            <View
              key={f.id}
              style={{
                flexDirection: 'row',
                gap: space.md,
                padding: space.lg,
                borderRadius: radius.md,
                backgroundColor: c.fill,
              }}
            >
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: tone, marginTop: 6 }} />
              <View style={{ flex: 1, gap: 2 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
                  <Text variant="bodyStrong" style={{ flex: 1 }}>
                    {f.area}
                  </Text>
                  <Text variant="tab" color={tone}>
                    {f.level}
                  </Text>
                </View>
                <Text variant="caption" tone="secondary" preserveCase>
                  {f.note}
                </Text>
                {f.evidence && (
                  <Text variant="tab" tone="tertiary">
                    {f.evidence}
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </View>

      <Text variant="caption" tone="tertiary">
        a screening flag is not a diagnosis. if something hurts, see a physio.
      </Text>
    </Sheet>
  );
}

function Tag({ label, brand }: { label: string; brand?: boolean }) {
  const c = useColors();
  return (
    <View
      style={{
        paddingHorizontal: space.md,
        height: 28,
        borderRadius: radius.pill,
        justifyContent: 'center',
        backgroundColor: brand ? c.brandTint : c.fill,
      }}
    >
      <Text variant="caption" tone={brand ? 'brand' : 'secondary'}>
        {label}
      </Text>
    </View>
  );
}

/* ----------------------------------------------------------------- video */

function VideoTab({
  report,
  index,
  onOpen,
}: {
  report: Report;
  index: ReturnType<typeof kpiIndex>;
  onOpen: (id: string) => void;
}) {
  const c = useColors();
  const frames = report.ratings.filter((r) => r.evidence);

  return (
    <>
      <Card style={{ aspectRatio: 4 / 5, alignItems: 'center', justifyContent: 'center', backgroundColor: c.fill, gap: space.sm }}>
        <Ionicons name="play-circle" size={52} color={c.textTertiary} />
        <Text variant="caption" tone="tertiary">
          your clip
        </Text>
      </Card>

      <Card padded={false}>
        {frames.map((r, i) => (
          <View key={r.kpiId}>
            {i > 0 && <Divider inset={space.xl} />}
            <Touch
              scale={false}
              haptic="selection"
              onPress={() => onOpen(r.kpiId)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.xl, paddingVertical: space.lg }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: radius.sm,
                  backgroundColor: c.fill,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="film-outline" size={17} color={c.textSecondary} />
              </View>
              <View style={{ flex: 1, gap: 1 }}>
                <Text variant="callout" numberOfLines={1}>
                  {index.get(r.kpiId)?.name}
                </Text>
                <Text variant="tab" tone="tertiary">
                  {r.evidence}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={15} color={c.textTertiary} />
            </Touch>
          </View>
        ))}
      </Card>
    </>
  );
}
