import React, { useEffect, useRef, useState } from 'react';
import { View, Animated, Easing, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Text } from '../../ui/Text';
import { Touch } from '../../ui/Pressable';
import { Button } from '../../ui/Button';
import { useColors, space, radius, font } from '../../theme';

/**
 * the nets, renamed **reactions** — three drills for the things a scenario
 * question can't test: how fast you pick a ball up, whether your timing holds
 * under speed, and whether your hands keep up when there's more than one.
 */

/* --------------------------------------------------------- slip reflex */

export function SlipReflex({ onScore }: { onScore: (pts: number) => void }) {
  const c = useColors();
  const [state, setState] = useState<'idle' | 'waiting' | 'go' | 'result' | 'early'>('idle');
  const [ms, setMs] = useState(0);
  const [best, setBest] = useState<number | null>(null);
  const started = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const arm = () => {
    setState('waiting');
    // the wait has to be unpredictable or you're timing the delay, not the ball
    timer.current = setTimeout(
      () => {
        started.current = Date.now();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        setState('go');
      },
      1400 + Math.random() * 2600,
    );
  };

  const tap = () => {
    if (state === 'idle' || state === 'result' || state === 'early') return arm();
    if (state === 'waiting') {
      clearTimeout(timer.current);
      return setState('early');
    }
    const t = Date.now() - started.current;
    setMs(t);
    setBest((b) => (b === null || t < b ? t : b));
    // 200ms is elite, 600ms is slow
    onScore(Math.max(0, Math.round(((600 - t) / 400) * 20)));
    setState('result');
  };

  const bg =
    state === 'go' ? c.brand : state === 'early' ? c.score.poor : state === 'waiting' ? c.fillStrong : c.fill;

  return (
    <Drill
      title="slip reflex"
      blurb="wait for the edge. tap the moment it comes — go early and it's a false start, same as moving too soon in the cordon."
      stat={best === null ? undefined : `best ${best}ms`}
    >
      <Pressable onPress={tap}>
        <View
          style={{
            height: 220,
            borderRadius: radius.lg,
            backgroundColor: bg,
            alignItems: 'center',
            justifyContent: 'center',
            gap: space.sm,
          }}
        >
          {state === 'idle' && <Big tone={c.textSecondary}>tap to start</Big>}
          {state === 'waiting' && <Big tone={c.textSecondary}>wait…</Big>}
          {state === 'go' && <Big tone="#FFFFFF">now</Big>}
          {state === 'early' && (
            <>
              <Big tone="#FFFFFF">too early</Big>
              <Text variant="caption" color="rgba(255,255,255,0.8)">
                tap to try again
              </Text>
            </>
          )}
          {state === 'result' && (
            <>
              <Big tone={c.text}>{`${ms}ms`}</Big>
              <Text variant="caption" tone="secondary">
                {ms < 220 ? 'elite' : ms < 300 ? 'sharp' : ms < 420 ? 'decent' : 'slow — go again'}
              </Text>
            </>
          )}
        </View>
      </Pressable>
    </Drill>
  );
}

/* ----------------------------------------------------------- timing bar */

export function TimingBar({ onScore }: { onScore: (pts: number) => void }) {
  const c = useColors();
  const [running, setRunning] = useState(false);
  const [combo, setCombo] = useState(0);
  const [best, setBest] = useState(0);
  const [verdict, setVerdict] = useState<string | null>(null);
  const x = useRef(new Animated.Value(0)).current;
  const pos = useRef(0);
  const loop = useRef<Animated.CompositeAnimation | undefined>(undefined);

  useEffect(() => {
    const id = x.addListener(({ value }) => (pos.current = value));
    return () => {
      x.removeListener(id);
      loop.current?.stop();
    };
  }, [x]);

  const sweep = (speed: number) => {
    loop.current?.stop();
    x.setValue(0);
    const seq = Animated.loop(
      Animated.sequence([
        Animated.timing(x, { toValue: 1, duration: speed, easing: Easing.linear, useNativeDriver: false }),
        Animated.timing(x, { toValue: 0, duration: speed, easing: Easing.linear, useNativeDriver: false }),
      ]),
    );
    loop.current = seq;
    seq.start();
  };

  const start = () => {
    setRunning(true);
    setCombo(0);
    setVerdict(null);
    sweep(1300);
  };

  const tap = () => {
    // the sweet zone is the middle tenth
    const off = Math.abs(pos.current - 0.5);
    if (off < 0.05) {
      const next = combo + 1;
      setCombo(next);
      setBest((b) => Math.max(b, next));
      setVerdict('perfect');
      onScore(3);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      sweep(Math.max(420, 1300 - next * 70)); // it speeds up as you hold the rhythm
    } else if (off < 0.12) {
      setVerdict('close');
      onScore(1);
      setCombo(0);
      sweep(1300);
    } else {
      setVerdict('missed');
      setCombo(0);
      setRunning(false);
      loop.current?.stop();
    }
  };

  return (
    <Drill
      title="timing bar"
      blurb="tap as the marker crosses the middle. hold the rhythm and it speeds up — miss and the spell's over."
      stat={best > 0 ? `best run ${best}` : undefined}
    >
      <View style={{ gap: space.lg }}>
        <View style={{ height: 56, borderRadius: radius.md, backgroundColor: c.fill, justifyContent: 'center', overflow: 'hidden' }}>
          {/* sweet zone */}
          <View
            style={{
              position: 'absolute',
              left: '45%',
              width: '10%',
              top: 0,
              bottom: 0,
              backgroundColor: c.brandTint,
              borderLeftWidth: 1,
              borderRightWidth: 1,
              borderColor: c.brandBorder,
            }}
          />
          <Animated.View
            style={{
              position: 'absolute',
              width: 5,
              top: 6,
              bottom: 6,
              borderRadius: 3,
              backgroundColor: c.brand,
              left: x.interpolate({ inputRange: [0, 1], outputRange: ['2%', '96%'] }),
            }}
          />
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
          <Text variant="heading" style={{ flex: 1 }}>
            {running ? `${combo} in a row` : verdict === 'missed' ? 'missed' : 'ready'}
          </Text>
          {verdict && (
            <Text variant="caption" tone={verdict === 'perfect' ? 'brand' : 'secondary'}>
              {verdict}
            </Text>
          )}
        </View>

        {running ? (
          <Button label="tap now" size="lg" full onPress={tap} />
        ) : (
          <Button label={verdict ? 'go again' : 'start'} size="lg" full icon="play" onPress={start} />
        )}
      </View>
    </Drill>
  );
}

/* --------------------------------------------------------- catch drill */

type Drop = { id: number; x: number; y: number; born: number };

export function CatchDrill({ onScore }: { onScore: (pts: number) => void }) {
  const c = useColors();
  const [running, setRunning] = useState(false);
  const [drops, setDrops] = useState<Drop[]>([]);
  const [caught, setCaught] = useState(0);
  const [dropped, setDropped] = useState(0);
  const [best, setBest] = useState(0);
  const tick = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const spawn = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const seq = useRef(0);

  const stop = () => {
    clearInterval(tick.current);
    clearInterval(spawn.current);
    setRunning(false);
  };
  useEffect(() => stop, []);

  const start = () => {
    setDrops([]);
    setCaught(0);
    setDropped(0);
    setRunning(true);
    seq.current = 0;

    spawn.current = setInterval(() => {
      setDrops((d) => [
        ...d,
        { id: seq.current++, x: 8 + Math.random() * 74, y: 6 + Math.random() * 62, born: Date.now() },
      ]);
    }, 780);

    tick.current = setInterval(() => {
      const now = Date.now();
      setDrops((d) => {
        const gone = d.filter((b) => now - b.born > 1500);
        if (gone.length) {
          setDropped((n) => {
            const next = n + gone.length;
            if (next >= 3) stop();
            return next;
          });
        }
        return d.filter((b) => now - b.born <= 1500);
      });
    }, 120);
  };

  const grab = (id: number) => {
    setDrops((d) => d.filter((b) => b.id !== id));
    setCaught((n) => {
      const next = n + 1;
      setBest((b) => Math.max(b, next));
      return next;
    });
    onScore(2);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <Drill
      title="catching drill"
      blurb="take every one before it hits the ground. three down and you're off."
      stat={best > 0 ? `best ${best} taken` : undefined}
    >
      <View style={{ gap: space.lg }}>
        <View
          style={{
            height: 300,
            borderRadius: radius.lg,
            backgroundColor: c.brandTint,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: c.brandBorder,
            overflow: 'hidden',
          }}
        >
          {drops.map((b) => (
            <Touch
              key={b.id}
              haptic={false}
              onPress={() => grab(b.id)}
              style={{
                position: 'absolute',
                left: `${b.x}%`,
                top: `${b.y}%`,
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: c.brand,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="ellipse" size={18} color="#FFFFFF" />
            </Touch>
          ))}

          {!running && (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.sm }}>
              <Big tone={c.text}>{caught > 0 ? `${caught} taken` : 'ready'}</Big>
              {dropped >= 3 && (
                <Text variant="caption" tone="secondary">
                  three down
                </Text>
              )}
            </View>
          )}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
          <Stat label="taken" value={String(caught)} />
          <Stat label="dropped" value={`${dropped}/3`} tone={dropped > 0 ? c.score.poor : undefined} />
          <View style={{ flex: 1 }} />
          {!running && <Button label={caught > 0 ? 'go again' : 'start'} icon="play" onPress={start} />}
        </View>
      </View>
    </Drill>
  );
}

/* ------------------------------------------------------------- shared */

function Drill({
  title,
  blurb,
  stat,
  children,
}: {
  title: string;
  blurb: string;
  stat?: string;
  children: React.ReactNode;
}) {
  const c = useColors();
  return (
    <View style={{ paddingHorizontal: space.gutter, gap: space.lg }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: space.md }}>
        <Text variant="callout" tone="secondary" style={{ flex: 1 }}>
          {blurb}
        </Text>
        {stat && (
          <Text variant="caption" tone="brand" style={{ fontFamily: font.bold }}>
            {stat}
          </Text>
        )}
      </View>
      {children}
    </View>
  );
}

function Big({ children, tone }: { children: React.ReactNode; tone: string }) {
  return <Text style={{ fontFamily: font.black, fontSize: 30, letterSpacing: -1.2, color: tone }}>{children}</Text>;
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  const c = useColors();
  return (
    <View style={{ gap: 1 }}>
      <Text variant="tab" tone="tertiary">
        {label}
      </Text>
      <Text variant="bodyStrong" color={tone ?? c.text}>
        {value}
      </Text>
    </View>
  );
}
