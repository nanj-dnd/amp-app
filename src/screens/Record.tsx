import React, { useState } from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Section } from '../ui/Screen';
import { Card } from '../ui/Card';
import { Segmented } from '../ui/Segmented';
import { UploadSlot } from '../ui/Bits';
import { Button } from '../ui/Button';
import { Text } from '../ui/Text';
import { Touch } from '../ui/Pressable';
import { BatIcon, BallIcon } from '../ui/Icons';
import { useColors, space, radius, font } from '../theme';
import { useStore } from '../state/store';
import { profileSummary } from '../state/types';

/**
 * stage 4 of the funnel: the first report is free and it is the entire pitch.
 * onboarding already answered every analysis parameter, so this screen asks for
 * clips and nothing else — and never mentions a price before a score exists.
 */
export function RecordScreen({ go, onClose }: { go: (r: string) => void; onClose?: () => void }) {
  const c = useColors();
  const { profile, progression, recordReport } = useStore();

  const [discipline, setDiscipline] = useState<'batting' | 'bowling'>(
    profile.discipline === 'bowling' ? 'bowling' : 'batting',
  );
  // two clips: the second adds a angle, a third added upload time and nothing else
  const [clips, setClips] = useState<boolean[]>([false, false]);
  const [running, setRunning] = useState(false);

  const ready = clips[0];
  const first = !progression.hasFirstReport;

  const run = () => {
    setRunning(true);
    // stand-in for the analysis round trip
    setTimeout(() => {
      const score = progression.ampScore ? Math.min(95, progression.ampScore + 2) : 63;
      recordReport(score);
      setRunning(false);
      go('report');
    }, 1600);
  };

  return (
    <Screen title={first ? 'your first report' : 'this week’s session'} eyebrow="record" onBack={onClose}>
      {first && (
        <Section>
          <Card style={{ backgroundColor: c.brand, flexDirection: 'row', alignItems: 'center', gap: space.md }}>
            <Ionicons name="sparkles" size={20} color="rgba(255,255,255,0.85)" />
            <Text variant="bodyStrong" tone="onBrand" style={{ flex: 1 }}>
              your first report is free
            </Text>
          </Card>
        </Section>
      )}

      <Section>
        <Touch
          onPress={() => go('you')}
          haptic="selection"
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: space.md,
            paddingHorizontal: space.lg,
            paddingVertical: space.md,
            borderRadius: radius.md,
            backgroundColor: c.brandTint,
          }}
        >
          {profile.discipline === 'bowling' ? <BallIcon size={19} color={c.brand} /> : <BatIcon size={19} color={c.brand} />}
          <Text variant="callout" style={{ flex: 1 }} numberOfLines={1}>
            {profileSummary(profile)}
          </Text>
          <Text variant="caption" tone="brand" style={{ fontFamily: font.bold }}>
            change
          </Text>
        </Touch>
      </Section>

      {profile.discipline === 'both' && (
        <Section title="this session">
          <View style={{ flexDirection: 'row', gap: space.sm }}>
            {([
              { v: 'batting', label: 'batting', Icon: BatIcon },
              { v: 'bowling', label: 'bowling', Icon: BallIcon },
            ] as const).map(({ v, label, Icon }) => {
              const on = discipline === v;
              return (
                <Touch
                  key={v}
                  haptic="selection"
                  onPress={() => setDiscipline(v)}
                  style={{
                    flexGrow: 1,
                    flexBasis: 0,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: space.sm,
                    height: 52,
                    borderRadius: radius.md,
                    backgroundColor: on ? c.brandTint : c.fill,
                    borderWidth: 1.5,
                    borderColor: on ? c.brand : 'transparent',
                  }}
                >
                  <Icon size={20} color={on ? c.brand : c.textSecondary} />
                  <Text variant="callout" tone={on ? 'brand' : 'secondary'}>
                    {label}
                  </Text>
                </Touch>
              );
            })}
          </View>
        </Section>
      )}

      <Section title="clips">
        <Card style={{ gap: space.sm }}>
          {clips.map((filled, i) => (
            <UploadSlot
              key={i}
              index={i + 1}
              filled={filled}
              onPress={() => setClips((cs) => cs.map((v, j) => (i === j ? !v : v)))}
            />
          ))}
          <Text variant="caption" tone="tertiary" style={{ marginTop: space.xs }}>
            side-on, waist height, full action in frame.
          </Text>
        </Card>
      </Section>

      <Section>
        <Button
          label={running ? 'analysing…' : first ? 'get my free report' : 'run analysis'}
          full
          size="lg"
          loading={running}
          disabled={!ready}
          icon="sparkles"
          onPress={run}
        />
      </Section>
    </Screen>
  );
}
