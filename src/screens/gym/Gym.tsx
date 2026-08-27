import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen, Section } from '../../ui/Screen';
import { Card, Divider } from '../../ui/Card';
import { Text } from '../../ui/Text';
import { Touch } from '../../ui/Pressable';
import { Button, IconButton } from '../../ui/Button';
import { EmptyState } from '../../ui/Bits';
import { useColors, space, radius, font } from '../../theme';
import { useStore, volumeOf, setsOf } from '../../state/store';
import { ROUTINES, fmtDuration } from '../../gym';

/** gym home: start something, or look at what's already been done. */
export function GymScreen({ go, onClose }: { go: (r: string) => void; onClose?: () => void }) {
  const c = useColors();
  const { gym, startWorkout } = useStore();

  const thisWeek = gym.history.filter((w) => Date.now() - w.startedAt < 7 * 86_400_000);
  const weekVolume = thisWeek.reduce((v, w) => v + volumeOf(w), 0);

  return (
    <Screen
      title="gym"
      onBack={onClose}
    >
      {gym.active && (
        <Section>
          <Card onPress={() => go('workout')} style={{ backgroundColor: c.brand }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
              <View style={{ flex: 1, gap: 3 }}>
                <Text variant="eyebrow" color="rgba(255,255,255,0.62)">
                  in progress
                </Text>
                <Text variant="heading" tone="onBrand">
                  {gym.active.name}
                </Text>
                <Text variant="caption" color="rgba(255,255,255,0.78)">
                  {`${gym.active.exercises.length} exercises · ${fmtDuration(Date.now() - gym.active.startedAt)}`}
                </Text>
              </View>
              <Ionicons name="arrow-forward-circle" size={30} color="rgba(255,255,255,0.9)" />
            </View>
          </Card>
        </Section>
      )}

      <Section gap={space.md}>
        <View style={{ flexDirection: 'row', gap: space.md }}>
          <Tile value={String(thisWeek.length)} label="sessions this week" />
          <Tile value={`${Math.round(weekVolume).toLocaleString()}`} label="kg volume" />
        </View>
      </Section>

      {!gym.active && (
        <Section>
          <Button label="start an empty workout" icon="add" size="lg" full onPress={() => { startWorkout(); go('workout'); }} />
        </Section>
      )}

      <Section title="routines">
        <Card padded={false}>
          {ROUTINES.map((r, i) => (
            <View key={r.id}>
              {i > 0 && <Divider inset={space.xl} />}
              <Touch
                scale={false}
                haptic="selection"
                onPress={() => {
                  startWorkout(r.name);
                  go(`workout:${r.id}`);
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: space.md,
                  paddingHorizontal: space.xl,
                  paddingVertical: space.lg,
                }}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: c.brandTint,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="barbell" size={17} color={c.brand} />
                </View>
                <View style={{ flex: 1, gap: 1 }}>
                  <Text variant="bodyStrong">{r.name}</Text>
                  <Text variant="caption" tone="secondary">
                    {`${r.sub} · ${r.exercises.length} exercises`}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={15} color={c.textTertiary} />
              </Touch>
            </View>
          ))}
        </Card>
      </Section>

      <Section title="history">
        {gym.history.length === 0 ? (
          <Card>
            <EmptyState
              icon="barbell-outline"
              title="nothing logged yet"
              body="two s&c sessions a week is what the plan asks for."
            />
          </Card>
        ) : (
          gym.history.slice(0, 12).map((w) => (
            <Card key={w.id} style={{ gap: space.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text variant="bodyStrong" style={{ flex: 1 }}>
                  {w.name}
                </Text>
                <Text variant="caption" tone="tertiary">
                  {new Date(w.startedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: space.xl }}>
                <Meta label="volume" value={`${Math.round(volumeOf(w))} kg`} />
                <Meta label="sets" value={String(setsOf(w))} />
                <Meta label="time" value={fmtDuration((w.endedAt ?? w.startedAt) - w.startedAt)} />
              </View>
            </Card>
          ))
        )}
      </Section>
    </Screen>
  );
}

function Tile({ value, label }: { value: string; label: string }) {
  return (
    <Card style={{ flex: 1, paddingVertical: space.xl }}>
      <Text variant="title">{value}</Text>
      <Text variant="caption" tone="secondary" style={{ marginTop: 4 }}>
        {label}
      </Text>
    </Card>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ gap: 1 }}>
      <Text variant="tab" tone="tertiary">
        {label}
      </Text>
      <Text variant="callout" style={{ fontFamily: font.bold }}>
        {value}
      </Text>
    </View>
  );
}
