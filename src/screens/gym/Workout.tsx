import React, { useEffect, useState } from 'react';
import { View, ScrollView, TextInput, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../../ui/Text';
import { Touch } from '../../ui/Pressable';
import { Button, IconButton } from '../../ui/Button';
import { useColors, space, radius, font, type } from '../../theme';
import { FullSheet } from '../../ui/Sheet';
import { useStore, volumeOf, setsOf, lastPerformance, personalBest } from '../../state/store';
import { EXERCISES, MUSCLES, ROUTINES, byId, fmtDuration } from '../../gym';
import type { LoggedExercise, LoggedSet } from '../../state/types';

/**
 * the live logger. same working model as hevy — a previous column so you know
 * what to beat, an inline weight/reps pair, and a tick that commits the set.
 */
export function WorkoutScreen({ routineId, onClose }: { routineId?: string; onClose: () => void }) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { gym, updateWorkout, finishWorkout, discardWorkout } = useStore();
  const [picking, setPicking] = useState(false);
  const [now, setNow] = useState(Date.now());

  const w = gym.active;

  // preload a routine's exercises the first time the screen opens for it
  useEffect(() => {
    if (!routineId || !w || w.exercises.length > 0) return;
    const r = ROUTINES.find((x) => x.id === routineId);
    if (!r) return;
    updateWorkout((cur) => ({
      ...cur,
      exercises: r.exercises.map((id) => newExercise(id)).filter(Boolean) as LoggedExercise[],
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routineId, w?.id]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!w) return null;

  const addExercise = (id: string) => {
    const e = newExercise(id);
    if (e) updateWorkout((cur) => ({ ...cur, exercises: [...cur.exercises, e] }));
    setPicking(false);
  };

  const patchExercise = (exIdx: number, fn: (e: LoggedExercise) => LoggedExercise) =>
    updateWorkout((cur) => ({
      ...cur,
      exercises: cur.exercises.map((e, i) => (i === exIdx ? fn(e) : e)),
    }));

  const confirmFinish = () => {
    if (setsOf(w) === 0) {
      Alert.alert('nothing logged', 'tick at least one set before finishing.');
      return;
    }
    finishWorkout();
    onClose();
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      {/* header: dismiss, title, finish — finish is the only filled button here */}
      <View
        style={{
          paddingTop: insets.top + space.sm,
          paddingBottom: space.md,
          paddingHorizontal: space.gutter,
          flexDirection: 'row',
          alignItems: 'center',
          gap: space.md,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: c.hairline,
          backgroundColor: c.surface,
        }}
      >
        <IconButton icon="chevron-down" size={34} onPress={onClose} />
        <Text variant="heading" style={{ flex: 1 }} numberOfLines={1}>
          {w.name}
        </Text>
        <Button label="finish" size="sm" onPress={confirmFinish} />
      </View>

      {/* live totals */}
      <View
        style={{
          flexDirection: 'row',
          paddingHorizontal: space.gutter,
          paddingVertical: space.lg,
          gap: space.xxl,
          backgroundColor: c.surface,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: c.hairline,
        }}
      >
        <Total label="duration" value={fmtDuration(now - w.startedAt)} tint={c.brand} />
        <Total label="volume" value={`${Math.round(volumeOf(w))} kg`} />
        <Total label="sets" value={String(setsOf(w))} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={80}>
        <ScrollView
          contentContainerStyle={{ padding: space.gutter, paddingBottom: insets.bottom + space.xxxl, gap: space.xl }}
          keyboardShouldPersistTaps="handled"
        >
          {w.exercises.map((e, i) => (
            <ExerciseBlock
              key={e.id}
              exercise={e}
              onPatch={(fn) => patchExercise(i, fn)}
              onRemove={() =>
                updateWorkout((cur) => ({ ...cur, exercises: cur.exercises.filter((_, j) => j !== i) }))
              }
            />
          ))}

          <Button label="add exercise" icon="add" kind="secondary" size="lg" full onPress={() => setPicking(true)} />
          <Button
            label="discard workout"
            kind="danger"
            full
            onPress={() =>
              Alert.alert('discard this workout?', 'nothing will be saved.', [
                { text: 'cancel', style: 'cancel' },
                { text: 'discard', style: 'destructive', onPress: () => { discardWorkout(); onClose(); } },
              ])
            }
          />
        </ScrollView>
      </KeyboardAvoidingView>

      {picking && <ExercisePicker onPick={addExercise} onClose={() => setPicking(false)} />}
    </View>
  );
}

function newExercise(exerciseId: string): LoggedExercise | null {
  const meta = byId(exerciseId);
  if (!meta) return null;
  return {
    id: `${exerciseId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    exerciseId,
    name: meta.name,
    muscle: meta.muscle,
    sets: [{ kg: 0, reps: 0, done: false }],
  };
}

function Total({ label, value, tint }: { label: string; value: string; tint?: string }) {
  const c = useColors();
  return (
    <View style={{ gap: 2 }}>
      <Text variant="tab" tone="tertiary">
        {label}
      </Text>
      <Text style={{ fontFamily: font.bold, fontSize: 17, color: tint ?? c.text }}>{value}</Text>
    </View>
  );
}

/* --------------------------------------------------------------- exercise */

function ExerciseBlock({
  exercise,
  onPatch,
  onRemove,
}: {
  exercise: LoggedExercise;
  onPatch: (fn: (e: LoggedExercise) => LoggedExercise) => void;
  onRemove: () => void;
}) {
  const c = useColors();
  const { gym } = useStore();
  const previous = lastPerformance(gym.history, exercise.exerciseId);
  const pb = personalBest(gym.history, exercise.exerciseId);

  const setSet = (i: number, patch: Partial<LoggedSet>) =>
    onPatch((e) => ({ ...e, sets: e.sets.map((s, j) => (j === i ? { ...s, ...patch } : s)) }));

  return (
    <View style={{ gap: space.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
        <View style={{ flex: 1, gap: 1 }}>
          <Text variant="bodyStrong" tone="brand">
            {exercise.name}
          </Text>
          <Text variant="caption" tone="tertiary">
            {pb > 0 ? `${exercise.muscle} · best ${pb} kg` : exercise.muscle}
          </Text>
        </View>
        <Touch scale={false} haptic="medium" onPress={onRemove} style={{ padding: space.sm }}>
          <Ionicons name="ellipsis-horizontal" size={18} color={c.textTertiary} />
        </Touch>
      </View>

      {/* column headers, sized to match the rows below exactly */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.xs }}>
        <Head w={34}>set</Head>
        <Head flex>previous</Head>
        <Head w={72} center>
          kg
        </Head>
        <Head w={62} center>
          reps
        </Head>
        <View style={{ width: 40 }} />
      </View>

      <View style={{ gap: space.sm }}>
        {exercise.sets.map((s, i) => {
          const prev = previous?.sets.filter((x) => x.done)[i];
          return (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
              <View
                style={{
                  width: 34,
                  height: 40,
                  borderRadius: radius.sm,
                  backgroundColor: s.done ? c.brandTint : c.fill,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text variant="callout" tone={s.done ? 'brand' : 'secondary'} style={{ fontFamily: font.bold }}>
                  {String(i + 1)}
                </Text>
              </View>

              <Text variant="caption" tone="tertiary" style={{ flex: 1 }} numberOfLines={1}>
                {prev ? `${prev.kg} kg × ${prev.reps}` : '—'}
              </Text>

              <NumField
                value={s.kg}
                onChange={(kg) => setSet(i, { kg })}
                placeholder={prev ? String(prev.kg) : '0'}
                width={72}
                decimal
              />
              <NumField
                value={s.reps}
                onChange={(reps) => setSet(i, { reps })}
                placeholder={prev ? String(prev.reps) : '0'}
                width={62}
              />

              <Touch
                haptic="medium"
                onPress={() => {
                  // ticking an untouched set adopts last week's numbers, so
                  // repeating a session is one tap rather than four keystrokes
                  if (!s.done && s.kg === 0 && s.reps === 0 && prev) {
                    setSet(i, { done: true, kg: prev.kg, reps: prev.reps });
                  } else {
                    setSet(i, { done: !s.done });
                  }
                }}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: radius.sm,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: s.done ? c.brand : c.fill,
                }}
              >
                <Ionicons name="checkmark" size={19} color={s.done ? c.textOnBrand : c.textTertiary} />
              </Touch>
            </View>
          );
        })}
      </View>

      <Touch
        haptic="light"
        onPress={() =>
          onPatch((e) => {
            const last = e.sets[e.sets.length - 1];
            return { ...e, sets: [...e.sets, { kg: last?.kg ?? 0, reps: last?.reps ?? 0, done: false }] };
          })
        }
        style={{
          height: 40,
          borderRadius: radius.sm,
          backgroundColor: c.fill,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 6,
        }}
      >
        <Ionicons name="add" size={16} color={c.textSecondary} />
        <Text variant="callout" tone="secondary">
          add set
        </Text>
      </Touch>
    </View>
  );
}

function Head({ children, w, flex, center }: { children: React.ReactNode; w?: number; flex?: boolean; center?: boolean }) {
  return (
    <Text
      variant="tab"
      tone="tertiary"
      style={{ width: w, flex: flex ? 1 : undefined, textAlign: center ? 'center' : 'left' }}
    >
      {children}
    </Text>
  );
}

function NumField({
  value,
  onChange,
  placeholder,
  width,
  decimal,
}: {
  value: number;
  onChange: (v: number) => void;
  placeholder: string;
  width: number;
  decimal?: boolean;
}) {
  const c = useColors();
  const [text, setText] = useState(value ? String(value) : '');

  useEffect(() => {
    setText(value ? String(value) : '');
  }, [value]);

  return (
    <TextInput
      value={text}
      onChangeText={(t) => {
        setText(t);
        const n = decimal ? parseFloat(t) : parseInt(t, 10);
        onChange(Number.isFinite(n) ? n : 0);
      }}
      placeholder={placeholder}
      placeholderTextColor={c.textTertiary}
      keyboardType={decimal ? 'decimal-pad' : 'number-pad'}
      selectTextOnFocus
      style={{
        ...type.callout,
        fontFamily: font.bold,
        width,
        height: 40,
        borderRadius: radius.sm,
        backgroundColor: c.fill,
        color: c.text,
        textAlign: 'center',
      }}
    />
  );
}

/* ----------------------------------------------------------------- picker */

function ExercisePicker({ onPick, onClose }: { onPick: (id: string) => void; onClose: () => void }) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState('');
  const [muscle, setMuscle] = useState<string | null>(null);

  const list = EXERCISES.filter(
    (e) =>
      (!muscle || e.muscle === muscle) &&
      (q.trim() === '' || e.name.toLowerCase().includes(q.trim().toLowerCase())),
  );

  return (
    <FullSheet onClose={onClose}>
      <View
        style={{
          paddingTop: insets.top + space.sm,
          paddingBottom: space.md,
          paddingHorizontal: space.gutter,
          gap: space.md,
          backgroundColor: c.surface,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: c.hairline,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
          <IconButton icon="close" size={34} onPress={onClose} />
          <Text variant="heading" style={{ flex: 1 }}>
            add exercise
          </Text>
        </View>

        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="search"
          placeholderTextColor={c.textTertiary}
          style={{
            ...type.body,
            color: c.text,
            backgroundColor: c.fill,
            borderRadius: radius.md,
            paddingHorizontal: space.lg,
            height: 44,
          }}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
          {[null, ...MUSCLES].map((m) => {
            const on = muscle === m;
            return (
              <Touch
                key={m ?? 'all'}
                haptic="selection"
                onPress={() => setMuscle(m)}
                style={{
                  paddingHorizontal: space.lg,
                  height: 34,
                  borderRadius: radius.pill,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: on ? c.brand : c.fill,
                }}
              >
                <Text variant="caption" tone={on ? 'onBrand' : 'secondary'}>
                  {m ?? 'all'}
                </Text>
              </Touch>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={{ padding: space.gutter, paddingBottom: insets.bottom + space.xl, gap: space.sm }}>
        {list.map((e) => (
          <Touch
            key={e.id}
            haptic="light"
            onPress={() => onPick(e.id)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: space.md,
              padding: space.lg,
              borderRadius: radius.md,
              backgroundColor: c.surface,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: c.hairline,
            }}
          >
            <View style={{ flex: 1, gap: 1 }}>
              <Text variant="bodyStrong">{e.name}</Text>
              <Text variant="caption" tone="tertiary">
                {e.note ? `${e.muscle} · ${e.note}` : e.muscle}
              </Text>
            </View>
            <Ionicons name="add-circle" size={22} color={c.brand} />
          </Touch>
        ))}
      </ScrollView>
    </FullSheet>
  );
}
