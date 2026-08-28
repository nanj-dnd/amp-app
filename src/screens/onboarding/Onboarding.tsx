import React, { useEffect, useRef, useState } from 'react';
import { View, ScrollView, Animated, Easing, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors, space, radius, font, METALS } from '../../theme';
import { Text } from '../../ui/Text';
import { MetalFill } from '../../ui/Metal';
import { Button, IconButton } from '../../ui/Button';
import { Segmented } from '../../ui/Segmented';
import { Input } from '../../ui/Bits';
import { Touch } from '../../ui/Pressable';
import { LogoMark } from '../../ui/Logo';
import { ScrollPicker, PickerRow } from '../../ui/ScrollPicker';
import { BatIcon, BallIcon, AllRounderIcon } from '../../ui/Icons';
import { OptionRow, Choice } from './Controls';
import { GOAL_TEMPLATES, HORIZONS, templatesFor, dateInWeeks, formatMetric } from '../../plan';
import { DEFAULT_PROFILE, type AthleteProfile, type Goal } from '../../state/types';
import { useStore } from '../../state/store';

/**
 * the d2c funnel, stage for stage:
 *   1 identity        name, age, height, weight — one screen, greeting-led
 *   2 cricket profile bat / ball / both, then level, order, speciality
 *   3 goal + date     a metric, two numbers and a deadline
 *   4 first report    free, and the whole pitch — lives on the record screen
 * the price is never mentioned here; it appears once a score is on screen.
 */
const STAGES = ['greeting', 'identity', 'cricket', 'goal', 'ready'] as const;
type Stage = (typeof STAGES)[number];

export function Onboarding() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useStore();

  const [i, setI] = useState(0);
  const [p, setP] = useState<AthleteProfile>(DEFAULT_PROFILE);
  const [tpl, setTpl] = useState(GOAL_TEMPLATES[0]);
  const [from, setFrom] = useState(GOAL_TEMPLATES[0].from);
  const [to, setTo] = useState(GOAL_TEMPLATES[0].to);
  const [weeks, setWeeks] = useState<number>(12);

  const stage: Stage = STAGES[i];
  const patch = (v: Partial<AthleteProfile>) => setP((prev) => ({ ...prev, ...v }));

  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(progress, {
      toValue: i / (STAGES.length - 1),
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [i, progress]);

  // when discipline changes, make sure the goal template still applies
  useEffect(() => {
    const allowed = templatesFor(p.discipline);
    if (!allowed.some((t) => t.metric === tpl.metric)) {
      const next = allowed[0];
      setTpl(next);
      setFrom(next.from);
      setTo(next.to);
    }
  }, [p.discipline, tpl.metric]);

  const goal: Goal = {
    metric: tpl.metric,
    label: tpl.label,
    unit: tpl.unit,
    from,
    to,
    higherIsBetter: tpl.higherIsBetter,
    targetDate: dateInWeeks(weeks),
  };

  const canAdvance = stage !== 'identity' || p.name.trim().length > 1;
  const next = () => setI((v) => Math.min(STAGES.length - 1, v + 1));
  const back = () => setI((v) => Math.max(0, v - 1));

  if (stage === 'greeting') return <Greeting onStart={next} />;
  if (stage === 'ready')
    return <Ready profile={{ ...p, goal }} onDone={() => completeOnboarding({ ...p, goal })} />;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top + space.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.gutter }}>
        <IconButton icon="chevron-back" size={34} onPress={back} />
        <View style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: c.fill, overflow: 'hidden' }}>
          <Animated.View
            style={{
              height: '100%',
              borderRadius: 4,
              backgroundColor: METALS.brand.base,
              overflow: 'hidden',
              width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
            }}
          >
            <MetalFill metal="brand" />
          </Animated.View>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={{ padding: space.gutter, paddingTop: space.xxl, paddingBottom: space.xxxl }}
          keyboardShouldPersistTaps="handled"
        >
          {stage === 'identity' && (
            <Q title="the basics" sub="height and weight let us read your body angles from video.">
              <View style={{ gap: space.xl }}>
                <Field label="name">
                  <Input value={p.name} onChangeText={(name) => patch({ name })} placeholder="your name" />
                </Field>

                <Field label="sex">
                  <Segmented
                    value={p.sex}
                    onChange={(sex) => patch({ sex })}
                    options={[
                      { value: 'male', label: 'male' },
                      { value: 'female', label: 'female' },
                    ]}
                  />
                </Field>

                <Field label="age · height · weight">
                  <PickerRow>
                    <Wheel label="years">
                      <ScrollPicker value={p.ageYears} onChange={(ageYears) => patch({ ageYears })} min={8} max={40} width={78} />
                    </Wheel>
                    <Wheel label="cm">
                      <ScrollPicker value={p.heightCm} onChange={(heightCm) => patch({ heightCm })} min={120} max={215} width={92} />
                    </Wheel>
                    <Wheel label="kg">
                      <ScrollPicker value={p.weightKg} onChange={(weightKg) => patch({ weightKg })} min={25} max={140} width={86} />
                    </Wheel>
                  </PickerRow>
                </Field>
              </View>
            </Q>
          )}

          {stage === 'cricket' && (
            <Q title="what do you play?" sub="this routes you into the right kpi sheet.">
              <View style={{ gap: space.sm }}>
                <OptionRow
                  glyph={(col) => <BatIcon size={21} color={col} />}
                  label="batting"
                  selected={p.discipline === 'batting'}
                  onPress={() => patch({ discipline: 'batting' })}
                />
                <OptionRow
                  glyph={(col) => <BallIcon size={21} color={col} />}
                  label="bowling"
                  selected={p.discipline === 'bowling'}
                  onPress={() => patch({ discipline: 'bowling' })}
                />
                <OptionRow
                  glyph={(col) => <AllRounderIcon size={21} color={col} />}
                  label="both"
                  sub="alternating focus each week"
                  selected={p.discipline === 'both'}
                  onPress={() => patch({ discipline: 'both' })}
                />
              </View>

              <Field label="level">
                <Choice
                  value={p.level}
                  onChange={(level) => patch({ level })}
                  options={[
                    { value: 'recreational', label: 'recreational' },
                { value: 'school', label: 'school' },
                    { value: 'club', label: 'club' },
                    { value: 'district', label: 'district' },
                    { value: 'state', label: 'state' },
                    { value: 'academy', label: 'academy' },
                  ]}
                />
              </Field>

              {p.discipline !== 'bowling' && (
                <>
                  <Field label="batting hand">
                    <Segmented
                      value={p.battingHand}
                      onChange={(battingHand) => patch({ battingHand })}
                      options={[
                        { value: 'right', label: 'right' },
                        { value: 'left', label: 'left' },
                      ]}
                    />
                  </Field>
                  <Field label="batting order">
                    <Choice
                      value={p.battingOrder}
                      onChange={(battingOrder) => patch({ battingOrder })}
                      options={[
                        { value: 'opener', label: 'opener' },
                        { value: 'top-order', label: 'top order' },
                        { value: 'middle-order', label: 'middle order' },
                        { value: 'finisher', label: 'finisher' },
                        { value: 'tail', label: 'tail' },
                      ]}
                    />
                  </Field>
                </>
              )}

              {p.discipline !== 'batting' && (
                <>
                  <Field label="bowling arm">
                    <Segmented
                      value={p.bowlingHand}
                      onChange={(bowlingHand) => patch({ bowlingHand })}
                      options={[
                        { value: 'right', label: 'right' },
                        { value: 'left', label: 'left' },
                      ]}
                    />
                  </Field>
                  <Field label="speciality">
                    <Choice
                      value={p.speciality}
                      onChange={(speciality) => patch({ speciality })}
                      options={[
                        { value: 'pace', label: 'pace' },
                        { value: 'medium', label: 'medium' },
                        { value: 'off-spin', label: 'off-spin' },
                        { value: 'leg-spin', label: 'leg-spin' },
                        { value: 'left-arm-orthodox', label: 'left-arm orthodox' },
                      ]}
                    />
                  </Field>
                </>
              )}
            </Q>
          )}

          {stage === 'goal' && (
            <Q title="what are you chasing?" sub="pick it, put numbers on it, give it a date. that's what the road gets built from.">
              <View style={{ gap: space.sm }}>
                {templatesFor(p.discipline).map((t) => (
                  <OptionRow
                    key={t.metric}
                    label={t.label}
                    selected={tpl.metric === t.metric}
                    onPress={() => {
                      setTpl(t);
                      setFrom(t.from);
                      setTo(t.to);
                    }}
                  />
                ))}
              </View>

              <Field label={`from → to (${tpl.unit})`}>
                <PickerRow>
                  <Wheel label="today">
                    <ScrollPicker
                      value={from}
                      onChange={setFrom}
                      min={tpl.step < 1 ? 2 : Math.max(0, Math.round(tpl.from * 0.4))}
                      max={Math.round(tpl.from * 1.8)}
                      step={tpl.step}
                      width={100}
                    />
                  </Wheel>
                  <Ionicons name="arrow-forward" size={18} color={c.textTertiary} />
                  <Wheel label="target">
                    <ScrollPicker
                      value={to}
                      onChange={setTo}
                      min={tpl.step < 1 ? 2 : Math.max(0, Math.round(tpl.to * 0.4))}
                      max={Math.round(tpl.to * 1.8)}
                      step={tpl.step}
                      width={100}
                    />
                  </Wheel>
                </PickerRow>
              </Field>

              <Field label="by when">
                <View style={{ gap: space.sm }}>
                  {HORIZONS.map((h) => (
                    <OptionRow
                      key={h.weeks}
                      label={h.label}
                      sub={h.sub}
                      selected={weeks === h.weeks}
                      onPress={() => setWeeks(h.weeks)}
                    />
                  ))}
                </View>
              </Field>

              <View
                style={{
                  padding: space.lg,
                  borderRadius: radius.md,
                  backgroundColor: c.brandTint,
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: c.brandBorder,
                }}
              >
                <Text variant="eyebrow" tone="brand" style={{ marginBottom: 4 }}>
                  your goal
                </Text>
                <Text variant="bodyStrong">
                  {`${tpl.label}: ${formatMetric(from)} → ${formatMetric(to)} ${tpl.unit}, in ${weeks} weeks`}
                </Text>
              </View>
            </Q>
          )}
        </ScrollView>

        <View
          style={{
            paddingHorizontal: space.gutter,
            paddingTop: space.md,
            paddingBottom: Math.max(insets.bottom, space.lg),
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: c.hairline,
            backgroundColor: c.surface,
          }}
        >
          <Button
            label={stage === 'goal' ? 'build my road' : 'continue'}
            size="lg"
            full
            disabled={!canAdvance}
            onPress={next}
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

/* ---------------------------------------------------------------- pieces */

function Q({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: space.xxl }}>
      <View style={{ gap: space.sm }}>
        <Text variant="title">{title}</Text>
        {sub && (
          <Text variant="callout" tone="secondary">
            {sub}
          </Text>
        )}
      </View>
      {children}
    </View>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: space.md }}>
      <Text variant="caption" tone="secondary">
        {label}
      </Text>
      {children}
    </View>
  );
}

function Wheel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ alignItems: 'center', gap: 2 }}>
      {children}
      <Text variant="tab" tone="tertiary">
        {label}
      </Text>
    </View>
  );
}

function Greeting({ onStart }: { onStart: () => void }) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const rise = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(rise, { toValue: 1, duration: 520, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [rise]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: c.bg,
        paddingHorizontal: space.gutter,
        paddingBottom: Math.max(insets.bottom, space.xl),
        paddingTop: insets.top,
      }}
    >
      <Animated.View
        style={{
          flex: 1,
          justifyContent: 'center',
          gap: space.lg,
          opacity: rise,
          transform: [{ translateY: rise.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
        }}
      >
        <LogoMark size={56} />
        <Text variant="display" style={{ marginTop: space.md }}>
          let's find out where your game actually is
        </Text>
        <Text variant="body" tone="secondary">
          three questions, then film one session. you'll have a real score and a road to your goal before
          anything costs you a rupee.
        </Text>
      </Animated.View>

      <Button label="start" size="lg" full onPress={onStart} />
      <Text variant="caption" tone="tertiary" align="center" style={{ marginTop: space.md }}>
        first report is free
      </Text>
    </View>
  );
}

const BUILD_STEPS = ['reading your profile', 'setting your weekly cadence', 'pacing the road to your date'];

function Ready({ profile, onDone }: { profile: AthleteProfile; onDone: () => void }) {
  const c = useColors();
  const [done, setDone] = useState(0);

  useEffect(() => {
    const t = BUILD_STEPS.map((_, i) => setTimeout(() => setDone(i + 1), 460 * (i + 1)));
    const end = setTimeout(onDone, 460 * BUILD_STEPS.length + 760);
    return () => {
      t.forEach(clearTimeout);
      clearTimeout(end);
    };
  }, [onDone]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: c.bg,
        alignItems: 'center',
        justifyContent: 'center',
        padding: space.xxxl,
        gap: space.xxl,
      }}
    >
      <LogoMark size={52} />
      <Text variant="title" align="center">
        building your road
      </Text>
      <View style={{ gap: space.md, alignSelf: 'stretch' }}>
        {BUILD_STEPS.map((s, i) => (
          <View
            key={s}
            style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, opacity: i < done ? 1 : 0.32 }}
          >
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: i < done ? c.brand : c.fill,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {i < done && <Ionicons name="checkmark" size={13} color="#FFF" />}
            </View>
            <Text variant="callout" tone={i < done ? 'primary' : 'tertiary'}>
              {s}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
