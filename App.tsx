import React, { useCallback, useState } from 'react';
import { View, StatusBar, StyleSheet } from 'react-native';
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

import { ThemeProvider, useColors } from './src/theme';
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

      {overlay === null && <TabBar active={tab} onChange={(k) => (k === 'add' ? setAdding(true) : setTab(k))} />}

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

      {overlay && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: c.bg }]}>
          {overlay.name === 'record' && <RecordScreen go={go} onClose={back} />}
          {overlay.name === 'report' && (
            <ReportScreen onClose={() => { back(); setTab('road'); }} onAsk={() => setOverlay({ name: 'ask' })} />
          )}
          {overlay.name === 'thread' && <ThreadScreen back={back} />}
          {overlay.name === 'ask' && <AskScreen go={go} onClose={back} />}
          {overlay.name === 'gym' && <GymScreen go={go} onClose={back} />}
          {overlay.name === 'workout' && <WorkoutScreen routineId={overlay.arg} onClose={() => setOverlay({ name: 'gym' })} />}
          {overlay.name === 'match' && <MatchFlow matchId={overlay.arg} onExit={back} />}
          {overlay.name === 'card' && <ShareCardScreen onClose={back} />}
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
