import React, { useState } from 'react';
import { View, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Section } from '../ui/Screen';
import { Card, Eyebrow, Divider } from '../ui/Card';
import { Text } from '../ui/Text';
import { Touch } from '../ui/Pressable';
import { Button } from '../ui/Button';
import { Segmented } from '../ui/Segmented';
import { Avatar, Input } from '../ui/Bits';
import { ScrollPicker, PickerRow } from '../ui/ScrollPicker';
import { Choice } from './onboarding/Controls';
import { BatIcon, BallIcon, AllRounderIcon } from '../ui/Icons';
import { useColors, space, radius, font, bandFor } from '../theme';
import { useStore } from '../state/store';
import { goalHeadline, templatesFor, formatMetric } from '../plan';
import { leagueFor } from '../state/types';

/**
 * one owner for every analysis parameter, plus the goal and the two pillars
 * that don't need a screen of their own. changing anything here re-derives the
 * road, because the plan is computed from the profile rather than stored.
 */
export function YouScreen({ go }: { go: (r: string) => void }) {
  const c = useColors();
  const { profile: p, progression, settings, updateProfile, updateSettings, reset } = useStore();
  const league = leagueFor(progression.iqPoints);

  return (
    <Screen title="you">
      <Section>
        <Card style={{ gap: space.xl }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.lg }}>
            <Avatar name={p.name || 'amp'} size={54} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="heading">{p.name || 'your name'}</Text>
              <Text variant="caption" tone="secondary">
                {`${p.ageYears}y · ${p.level}`}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: league.colour }} />
              <Text variant="caption" tone="secondary">
                {league.label}
              </Text>
            </View>
          </View>

          <Divider />

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flex: 1, gap: 2 }}>
              <Eyebrow style={{ marginBottom: 0 }}>amp score</Eyebrow>
              <Text variant="score" color={progression.ampScore ? c.score[bandFor(progression.ampScore)] : c.textTertiary}>
                {progression.ampScore > 0 ? String(progression.ampScore) : '—'}
              </Text>
            </View>
            <Button label="share card" kind="secondary" size="sm" icon="share-outline" onPress={() => go('card')} />
          </View>
        </Card>
      </Section>

      {/* the goal drives the road, so it sits directly under identity */}
      <Section title="goal">
        <Card style={{ gap: space.md }}>
          {p.goal ? (
            <>
              <Text variant="bodyStrong">{goalHeadline(p.goal)}</Text>
              <Text variant="caption" tone="secondary">
                {`by ${new Date(p.goal.targetDate).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}`}
              </Text>
              <Choice
                value={p.goal.metric}
                onChange={(metric) => {
                  const t = templatesFor(p.discipline).find((x) => x.metric === metric);
                  if (t && p.goal)
                    updateProfile({
                      goal: { ...p.goal, metric: t.metric, label: t.label, unit: t.unit, higherIsBetter: t.higherIsBetter, from: t.from, to: t.to },
                    });
                }}
                options={templatesFor(p.discipline).map((t) => ({ value: t.metric, label: t.label }))}
              />
              <PickerRow>
                <Wheel label="today">
                  <ScrollPicker
                    value={p.goal.from}
                    onChange={(from) => p.goal && updateProfile({ goal: { ...p.goal, from } })}
                    min={0}
                    max={Math.max(20, Math.round(p.goal.from * 2))}
                    width={100}
                  />
                </Wheel>
                <Ionicons name="arrow-forward" size={18} color={c.textTertiary} />
                <Wheel label="target">
                  <ScrollPicker
                    value={p.goal.to}
                    onChange={(to) => p.goal && updateProfile({ goal: { ...p.goal, to } })}
                    min={0}
                    max={Math.max(20, Math.round(p.goal.to * 2))}
                    width={100}
                  />
                </Wheel>
              </PickerRow>
            </>
          ) : (
            <Text variant="callout" tone="secondary">
              no goal set — the road needs one to know how long it is.
            </Text>
          )}
        </Card>
      </Section>

      <Section title="analysis profile" action={<Text variant="caption" tone="tertiary">used on every report</Text>}>
        <Card style={{ gap: space.xl }}>
          <Field label="name">
            <Input value={p.name} onChangeText={(name) => updateProfile({ name })} placeholder="your name" />
          </Field>

          <Field label="discipline">
            <View style={{ flexDirection: 'row', gap: space.sm }}>
              {([
                { v: 'batting', label: 'batting', Icon: BatIcon },
                { v: 'bowling', label: 'bowling', Icon: BallIcon },
                { v: 'both', label: 'both', Icon: AllRounderIcon },
              ] as const).map(({ v, label, Icon }) => {
                const on = p.discipline === v;
                return (
                  <Touch
                    key={v}
                    haptic="selection"
                    onPress={() => updateProfile({ discipline: v })}
                    style={{
                      flex: 1,
                      alignItems: 'center',
                      gap: 6,
                      paddingVertical: space.md,
                      borderRadius: radius.md,
                      backgroundColor: on ? c.brandTint : c.fill,
                      borderWidth: 1.5,
                      borderColor: on ? c.brand : 'transparent',
                    }}
                  >
                    <Icon size={22} color={on ? c.brand : c.textSecondary} />
                    <Text variant="caption" tone={on ? 'brand' : 'secondary'}>
                      {label}
                    </Text>
                  </Touch>
                );
              })}
            </View>
          </Field>

          <Field label="level">
            <Choice
              value={p.level}
              onChange={(level) => updateProfile({ level })}
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
                  onChange={(battingHand) => updateProfile({ battingHand })}
                  options={[
                    { value: 'right', label: 'right' },
                    { value: 'left', label: 'left' },
                  ]}
                />
              </Field>
              <Field label="batting order">
                <Choice
                  value={p.battingOrder}
                  onChange={(battingOrder) => updateProfile({ battingOrder })}
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
                  onChange={(bowlingHand) => updateProfile({ bowlingHand })}
                  options={[
                    { value: 'right', label: 'right' },
                    { value: 'left', label: 'left' },
                  ]}
                />
              </Field>
              <Field label="speciality">
                <Choice
                  value={p.speciality}
                  onChange={(speciality) => updateProfile({ speciality })}
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

          <Field label="age · height · weight">
            <PickerRow>
              <Wheel label="years">
                <ScrollPicker value={p.ageYears} onChange={(ageYears) => updateProfile({ ageYears })} min={8} max={40} width={78} />
              </Wheel>
              <Wheel label="cm">
                <ScrollPicker value={p.heightCm} onChange={(heightCm) => updateProfile({ heightCm })} min={120} max={215} width={92} />
              </Wheel>
              <Wheel label="kg">
                <ScrollPicker value={p.weightKg} onChange={(weightKg) => updateProfile({ weightKg })} min={25} max={140} width={86} />
              </Wheel>
            </PickerRow>
          </Field>
        </Card>
      </Section>

      <Section title="appearance">
        <Card style={{ gap: space.md }}>
          <Segmented
            value={settings.theme}
            onChange={(theme) => updateSettings({ theme })}
            options={[
              { value: 'light', label: 'light' },
              { value: 'dark', label: 'dark' },
              { value: 'system', label: 'system' },
            ]}
          />
          <Text variant="caption" tone="tertiary">
            amp opens light by default. pick system if you'd rather it follow your phone.
          </Text>
        </Card>
      </Section>

      <Section title="more">
        <Card padded={false}>
          {[
            { icon: 'nutrition-outline', label: 'nutrition', sub: 'handed to a qualified advisor', route: '' },
            { icon: 'sparkles-outline', label: 'ask amp', sub: 'anything about your game', route: 'ask' },
            { icon: 'trending-up-outline', label: 'progress', sub: 'score, trends, past sessions', route: 'progress' },
            { icon: 'medkit-outline', label: 'physio', sub: 'escalate a niggle', route: '' },
          ].map((r, i) => (
            <View key={r.label}>
              {i > 0 && <Divider inset={54} />}
              <Touch
                scale={false}
                haptic="selection"
                onPress={() => r.route && go(r.route)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: space.md,
                  paddingHorizontal: space.xl,
                  paddingVertical: space.lg,
                }}
              >
                <Ionicons name={r.icon as any} size={19} color={c.textSecondary} />
                <View style={{ flex: 1, gap: 1 }}>
                  <Text variant="body">{r.label}</Text>
                  <Text variant="caption" tone="tertiary">
                    {r.sub}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={15} color={c.textTertiary} />
              </Touch>
            </View>
          ))}
        </Card>
      </Section>

      <Section>
        <Button
          label="reset app"
          kind="danger"
          full
          onPress={() =>
            Alert.alert('reset everything?', 'wipes your profile, road, gym history and progress.', [
              { text: 'cancel', style: 'cancel' },
              { text: 'reset', style: 'destructive', onPress: reset },
            ])
          }
        />
      </Section>
    </Screen>
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
