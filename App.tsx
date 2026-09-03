import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, StatusBar, StyleSheet, Animated } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as ExpoSplash from 'expo-splash-screen';
import {
  useFonts,
  Archivo_400Regular,
  Archivo_500Medium,
  Archivo_600SemiBold,
  Archivo_700Bold,
  Archivo_800ExtraBold,
} from '@expo-google-fonts/archivo';

import { ThemeProvider, useColors, motion, useReduceMotion } from './src/theme';
import { StoreProvider, useStore } from './src/state/store';
import { TabBar, type TabKey } from './src/ui/TabBar';
import { ActionSheet } from './src/ui/ActionSheet';
import { SplashScreen } from './src/screens/Splash';
import { Onboarding } from './src/screens/onboarding/Onboarding';
import { RoadScreen } from './src/screens/Road';
import { RecordScreen } from './src/screens/Record';
import { ReportScreen } from './src/screens/report/Report';
import { GameIQScreen } from './src/screens/GameIQ';
import { GymScreen } from './src/screens/gym/Gym';
import { WorkoutScreen } from './src/screens/gym/Workout';
import { MatchFlow } from './src/screens/match/MatchFlow';
import { AskScreen, ThreadScreen } from './src/screens/Ask';
import { ProgressScreen } from './src/screens/Progress';
import { YouScreen } from './src/screens/You';
import { ShareCardScreen } from './src/screens/ShareCard';

ExpoSplash.preventAutoHideAsync().catch(() => {});

type OverlayName = 'record' | 'report' | 'thread' | 'ask' | 'gym' | 'workout' | 'match' | 'card';
type Overlay = { name: OverlayName; arg?: string } | null;

const TAB_KEYS: TabKey[] = ['road', 'iq', 'add', 'progress', 'you'];
const OVERLAYS: OverlayName[] = ['record', 'report', 'thread', 'ask', 'gym', 'workout', 'match', 'card'];

function Tabs() {
  const c = useColors();
  const { match } = useStore();
  const [tab, setTab] = useState<TabKey>('road');
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [adding, setAdding] = useState(false);
  const reduce = useReduceMotion();

  /**
   * overlays normally swap instantly, and should: opening one from the [+] is
   * already covered by the action sheet leaving, and closing one back to the
   * tabs wants to be immediate.
   *
   * the exception is one overlay replacing another, which happens exactly once
   * in the product and at the moment that matters most — record hands over to
   * report when the analysis finishes. that cut lands on a fully drawn score,
   * which is the funnel's whole payoff arriving as a jump. the bridge costs
   * nothing new: `Record` already spends 1.6s waiting, so the fade comes out of
   * time that is being spent anyway.
   */
  const [shown, setShown] = useState<Overlay>(null);
  const fade = useRef(new Animated.Value(1)).current;
  const prev = useRef<Overlay>(null);

  useEffect(() => {
    const from = prev.current;
    prev.current = overlay;
    const bridging = !!from && !!overlay && from.name !== overlay.name;

    if (!bridging || reduce) {
      setShown(overlay);
      fade.setValue(1);
      return;
    }
    Animated.timing(fade, { toValue: 0, duration: motion.fast, useNativeDriver: true }).start(({ finished }) => {
      if (!finished) return;
      setShown(overlay);
      Animated.timing(fade, { toValue: 1, duration: motion.base, useNativeDriver: true }).start();
    });
  }, [overlay, reduce, fade]);

  const go = (route: string) => {
    const [name, arg] = route.split(':');
    if (name === 'add') return setAdding(true);
    if (TAB_KEYS.includes(name as TabKey)) {
      setOverlay(null);
      return setTab(name as TabKey);
    }
    if (OVERLAYS.includes(name as OverlayName)) setOverlay({ name: name as OverlayName, arg });
  };
  const back = () => setOverlay(null);

  const live = match.activeId ? match.matches.find((m) => m.id === match.activeId) : undefined;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      {tab === 'road' && <RoadScreen go={go} />}
      {tab === 'iq' && <GameIQScreen go={go} />}
      {tab === 'progress' && <ProgressScreen go={go} />}
      {tab === 'you' && <YouScreen go={go} />}

      {/* keyed off `shown`, not `overlay` — `shown` lags by a frame while the
          effect below decides whether to bridge, and hiding the bar off the
          leading value flashes a tab screen with no tab bar for that frame. */}
      {shown === null && <TabBar active={tab} onChange={(k) => (k === 'add' ? setAdding(true) : setTab(k))} />}

      {adding && (
        <ActionSheet
          onClose={() => setAdding(false)}
          onPick={(id) => {
            setAdding(false);
            if (id === 'record') setOverlay({ name: 'record' });
            if (id === 'match') setOverlay({ name: 'match', arg: live?.id });
            if (id === 'gym') setOverlay({ name: 'gym' });
          }}
          actions={[
            {
              id: 'record',
              label: 'film a session',
              detail: 'one clip, one report — the weekly one',
              icon: 'videocam',
              primary: true,
            },
            {
              id: 'match',
              label: live ? 'resume scoring' : 'score a match',
              detail: live ? `${live.teams[0].name} v ${live.teams[1].name}` : 'ball by ball, with the detail kept',
              icon: 'stopwatch',
            },
            { id: 'gym', label: 'log a workout', detail: 'strength & conditioning', icon: 'barbell' },
          ]}
        />
      )}

      {shown && (
        // the backdrop stays opaque and only the screens inside it cross-fade.
        // fading the whole overlay let the tab screen behind it composite
        // through the middle of the handover, so for a beat you were looking at
        // progress or the road — it read as going back and then forward again.
        // dipping through the page's own background instead keeps the two
        // overlays the only two things in the transition.
        <View style={[StyleSheet.absoluteFill, { backgroundColor: c.bg }]}>
        <Animated.View style={{ flex: 1, opacity: fade }}>
          {shown.name === 'record' && <RecordScreen go={go} onClose={back} />}
          {shown.name === 'report' && (
            <ReportScreen onClose={() => { back(); setTab('road'); }} onAsk={() => setOverlay({ name: 'ask' })} />
          )}
          {shown.name === 'thread' && <ThreadScreen back={back} />}
          {shown.name === 'ask' && <AskScreen go={go} onClose={back} />}
          {shown.name === 'gym' && <GymScreen go={go} onClose={back} />}
          {shown.name === 'workout' && <WorkoutScreen routineId={shown.arg} onClose={() => setOverlay({ name: 'gym' })} />}
          {shown.name === 'match' && <MatchFlow matchId={shown.arg} onExit={back} />}
          {shown.name === 'card' && <ShareCardScreen onClose={back} />}
        </Animated.View>
        </View>
      )}
    </View>
  );
}

function Root() {
  const c = useColors();
  const { hydrated, onboarded } = useStore();
  const [splashDone, setSplashDone] = useState(false);
  const finishSplash = useCallback(() => setSplashDone(true), []);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <StatusBar barStyle={c.scheme === 'dark' ? 'light-content' : 'dark-content'} />
      {!splashDone || !hydrated ? (
        <SplashScreen onDone={finishSplash} />
      ) : onboarded ? (
        <Tabs />
      ) : (
        <Onboarding />
      )}
    </View>
  );
}

export default function App() {
  const [loaded] = useFonts({
    Archivo_400Regular,
    Archivo_500Medium,
    Archivo_600SemiBold,
    Archivo_700Bold,
    Archivo_800ExtraBold,
  });

  const onLayout = useCallback(() => {
    if (loaded) ExpoSplash.hideAsync().catch(() => {});
  }, [loaded]);

  if (!loaded) return null;

  return (
    <SafeAreaProvider>
      <StoreProvider>
        <Themed onLayout={onLayout} />
      </StoreProvider>
    </SafeAreaProvider>
  );
}

/** sits inside the store so the athlete's theme choice can drive the palette. */
function Themed({ onLayout }: { onLayout: () => void }) {
  const { settings } = useStore();
  return (
    <ThemeProvider choice={settings.theme}>
      <View style={{ flex: 1 }} onLayout={onLayout}>
        <Root />
      </View>
    </ThemeProvider>
  );
}
