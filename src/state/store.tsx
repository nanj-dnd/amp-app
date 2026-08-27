import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  type AppState,
  type AthleteProfile,
  type Progression,
  type GymState,
  type MatchState,
  type Settings,
  type Workout,
  type LoggedExercise,
  DEFAULT_PROFILE,
  DEFAULT_PROGRESSION,
  DEFAULT_GYM,
  DEFAULT_MATCH,
  DEFAULT_SETTINGS,
} from './types';
import type { Match } from '../match/types';
import { weekKey, type ActionKind } from '../plan';

const KEY = 'amp.state.v4';

type Store = AppState & {
  hydrated: boolean;
  completeOnboarding: (p: AthleteProfile) => void;
  updateProfile: (patch: Partial<AthleteProfile>) => void;
  updateSettings: (patch: Partial<Settings>) => void;

  /** log one occurrence of a weekly action against the current week. */
  logAction: (id: ActionKind) => void;
  /** bank a finished report: moves the amp score and closes the week's record. */
  recordReport: (score: number) => void;
  /** bank one answered game iq question. */
  answerIq: (correct: boolean, points: number) => void;

  saveMatch: (m: Match) => void;
  setActiveMatch: (id: string | null) => void;
  deleteMatch: (id: string) => void;

  startWorkout: (name?: string) => void;
  updateWorkout: (fn: (w: Workout) => Workout) => void;
  finishWorkout: () => void;
  discardWorkout: () => void;

  reset: () => void;
};

const Ctx = createContext<Store | null>(null);

const EMPTY: AppState = {
  onboarded: false,
  settings: DEFAULT_SETTINGS,
  profile: DEFAULT_PROFILE,
  progression: DEFAULT_PROGRESSION,
  gym: DEFAULT_GYM,
  match: DEFAULT_MATCH,
};

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(EMPTY);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        if (raw) {
          const saved = JSON.parse(raw) as Partial<AppState>;
          // merge rather than replace, so adding a field later doesn't wipe
          // an existing athlete's history
          setState({
            onboarded: !!saved.onboarded,
            settings: { ...DEFAULT_SETTINGS, ...saved.settings },
            profile: { ...DEFAULT_PROFILE, ...saved.profile },
            progression: { ...DEFAULT_PROGRESSION, ...saved.progression },
            gym: { ...DEFAULT_GYM, ...saved.gym },
            match: { ...DEFAULT_MATCH, ...saved.match },
          });
        }
      } catch {
        // corrupt payload — start clean rather than crash on boot
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  const persist = useCallback((next: AppState) => {
    setState(next);
    AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const value = useMemo<Store>(() => {
    const withProgression = (fn: (p: Progression) => Progression) =>
      persist({ ...state, progression: fn(state.progression) });
    const withGym = (fn: (g: GymState) => GymState) => persist({ ...state, gym: fn(state.gym) });

    const touch = (p: Progression): Progression => ({
      ...p,
      streak: bumpStreak(p),
      lastActive: today(),
    });

    const push = (p: Progression, id: ActionKind): Progression => {
      const k = weekKey();
      return { ...p, weekActions: { ...p.weekActions, [k]: [...(p.weekActions[k] ?? []), id] } };
    };

    return {
      ...state,
      hydrated,

      completeOnboarding: (profile) =>
        persist({ ...state, onboarded: true, profile, progression: touch(state.progression) }),

      updateProfile: (patch) => persist({ ...state, profile: { ...state.profile, ...patch } }),

      updateSettings: (patch) => persist({ ...state, settings: { ...state.settings, ...patch } }),

      logAction: (id) => withProgression((p) => touch(push(p, id))),

      recordReport: (score) =>
        withProgression((p) =>
          touch({
            ...push(p, 'record'),
            ampScore: score,
            history: [...p.history, { date: today(), score }],
            hasFirstReport: true,
          }),
        ),

      answerIq: (correct, points) =>
        withProgression((p) => {
          const k = weekKey();
          const logged = p.weekActions[k] ?? [];
          // one iq credit per calendar day, however many questions get answered
          const alreadyToday = p.lastActive === today() && logged.includes('iq');
          const next = alreadyToday ? p : push(p, 'iq');
          return touch({
            ...next,
            iqPoints: p.iqPoints + points,
            iqAnswered: p.iqAnswered + 1,
            iqCorrect: p.iqCorrect + (correct ? 1 : 0),
          });
        }),

      saveMatch: (m) =>
        persist({
          ...state,
          match: {
            activeId: m.status === 'done' ? null : m.id,
            matches: [m, ...state.match.matches.filter((x) => x.id !== m.id)],
          },
        }),

      setActiveMatch: (id) => persist({ ...state, match: { ...state.match, activeId: id } }),

      deleteMatch: (id) =>
        persist({
          ...state,
          match: {
            activeId: state.match.activeId === id ? null : state.match.activeId,
            matches: state.match.matches.filter((m) => m.id !== id),
          },
        }),

      startWorkout: (name) =>
        withGym((g) => ({
          ...g,
          active: {
            id: String(Date.now()),
            name: name ?? defaultWorkoutName(),
            startedAt: Date.now(),
            exercises: [],
          },
        })),

      updateWorkout: (fn) => withGym((g) => (g.active ? { ...g, active: fn(g.active) } : g)),

      finishWorkout: () => {
        const w = state.gym.active;
        if (!w) return;
        const done: Workout = { ...w, endedAt: Date.now() };
        persist({
          ...state,
          gym: { active: null, history: [done, ...state.gym.history] },
          progression: touch(push(state.progression, 'gym')),
        });
      },

      discardWorkout: () => withGym((g) => ({ ...g, active: null })),

      reset: () => {
        AsyncStorage.removeItem(KEY).catch(() => {});
        setState(EMPTY);
      },
    };
  }, [state, hydrated, persist]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore must be used inside <StoreProvider>');
  return v;
}

/* ---------------------------------------------------------------- helpers */

const today = () => new Date().toISOString().slice(0, 10);

/** same day holds, next day extends, any gap resets to 1. */
function bumpStreak(p: Progression): number {
  const now = today();
  if (p.lastActive === now) return p.streak || 1;
  if (!p.lastActive) return 1;
  const gap = (Date.parse(now) - Date.parse(p.lastActive)) / 86_400_000;
  return gap === 1 ? p.streak + 1 : 1;
}

function defaultWorkoutName(): string {
  const h = new Date().getHours();
  return h < 11 ? 'morning workout' : h < 17 ? 'afternoon workout' : 'evening workout';
}

/* ------------------------------------------------------------- gym maths */

export const volumeOf = (w: Workout) =>
  w.exercises.reduce(
    (sum, e) => sum + e.sets.filter((s) => s.done).reduce((v, s) => v + s.kg * s.reps, 0),
    0,
  );

export const setsOf = (w: Workout) =>
  w.exercises.reduce((n, e) => n + e.sets.filter((s) => s.done).length, 0);

/** heaviest completed set for an exercise across history — the "previous" column. */
export function lastPerformance(history: Workout[], exerciseId: string): LoggedExercise | null {
  for (const w of history) {
    const hit = w.exercises.find((e) => e.exerciseId === exerciseId && e.sets.some((s) => s.done));
    if (hit) return hit;
  }
  return null;
}

export function personalBest(history: Workout[], exerciseId: string): number {
  let best = 0;
  for (const w of history)
    for (const e of w.exercises)
      if (e.exerciseId === exerciseId)
        for (const s of e.sets) if (s.done && s.kg > best) best = s.kg;
  return best;
}
