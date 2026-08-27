import React, { useState } from 'react';
import { View, ScrollView, TextInput, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../../ui/Text';
import { Touch } from '../../ui/Pressable';
import { Button, IconButton } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { Choice } from '../onboarding/Controls';
import { ScrollPicker, PickerRow } from '../../ui/ScrollPicker';
import { useColors, space, radius, font, type } from '../../theme';
import {
  DEFAULT_CONFIG,
  FORMATS,
  BALL_TYPES,
  PITCH_TYPES,
  emptyTeam,
  type Match,
  type MatchConfig,
  type Team,
} from '../../match/types';

/**
 * cricheroes asks for fourteen fields before a ball is bowled — format, overs,
 * per-bowler quota, powerplay, city, ground, date, ball, wagon-wheel toggle,
 * pitch, four kinds of official — on one dense screen.
 *
 * this asks for the four that change the scoring (teams, overs, quota) and puts
 * everything else behind "match details", pre-filled with sane defaults. you can
 * be scoring in about twenty seconds.
 */
export function MatchSetup({ onStart, onClose }: { onStart: (m: Match) => void; onClose: () => void }) {
  const c = useColors();
  const insets = useSafeAreaInsets();

  const [config, setConfig] = useState<MatchConfig>(DEFAULT_CONFIG);
  const [home, setHome] = useState<Team>(emptyTeam(''));
  const [away, setAway] = useState<Team>(emptyTeam(''));
  const [more, setMore] = useState(false);

  const patch = (v: Partial<MatchConfig>) => setConfig((p) => ({ ...p, ...v }));
  const ready = home.name.trim().length > 1 && away.name.trim().length > 1 && config.overs > 0;

  const start = () => {
    onStart({
      id: `m-${Date.now()}`,
      createdAt: Date.now(),
      config,
      teams: [home, away],
      toss: null,
      innings: [],
      status: 'setup',
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <Header title="new match" onClose={onClose} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={{ padding: space.gutter, paddingBottom: space.xxxl, gap: space.xxl }}
          keyboardShouldPersistTaps="handled"
        >
          <Field label="teams">
            <Card style={{ gap: space.md }}>
              <TeamInput value={home.name} onChange={(name) => setHome({ ...home, name })} placeholder="home team" />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                <View style={{ flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: c.hairline }} />
                <Text variant="tab" tone="tertiary">
                  v
                </Text>
                <View style={{ flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: c.hairline }} />
              </View>
              <TeamInput value={away.name} onChange={(name) => setAway({ ...away, name })} placeholder="away team" />
            </Card>
          </Field>

          <Field label="format">
            <Choice
              value={config.format}
              onChange={(format) => {
                const f = FORMATS.find((x) => x.value === format)!;
                patch({ format, overs: f.overs, oversPerBowler: Math.max(1, Math.ceil(f.overs / 5)) });
              }}
              options={FORMATS.map((f) => ({ value: f.value, label: f.label }))}
            />
          </Field>

          <Field label="overs">
            <PickerRow>
              <Wheel label="total">
                <ScrollPicker value={config.overs} onChange={(overs) => patch({ overs })} min={1} max={90} width={100} />
              </Wheel>
              <Wheel label="per bowler">
                <ScrollPicker
                  value={config.oversPerBowler}
                  onChange={(oversPerBowler) => patch({ oversPerBowler })}
                  min={1}
                  max={Math.max(1, config.overs)}
                  width={100}
                />
              </Wheel>
            </PickerRow>
          </Field>

          <Touch
            haptic="light"
            onPress={() => setMore((v) => !v)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}
          >
            <Text variant="callout" tone="brand" style={{ fontFamily: font.bold }}>
              match details
            </Text>
            <Ionicons name={more ? 'chevron-up' : 'chevron-down'} size={15} color={c.brand} />
            {!more && (
              <Text variant="caption" tone="tertiary">
                optional
              </Text>
            )}
          </Touch>

          {more && (
            <View style={{ gap: space.xl }}>
              <Field label="ground">
                <Card style={{ gap: space.md }}>
                  <TeamInput value={config.ground} onChange={(ground) => patch({ ground })} placeholder="ground" />
                  <TeamInput value={config.city} onChange={(city) => patch({ city })} placeholder="city or town" />
                </Card>
              </Field>

              <Field label="ball">
                <Choice
                  value={config.ballType}
                  onChange={(ballType) => patch({ ballType })}
                  options={BALL_TYPES.map((b) => ({ value: b.value, label: b.label }))}
                />
              </Field>

              <Field label="pitch">
                <Choice
                  value={config.pitch}
                  onChange={(pitch) => patch({ pitch })}
                  options={PITCH_TYPES.map((p) => ({ value: p.value, label: p.label }))}
                />
              </Field>

              {/* the reason this app exists rather than just a scorer */}
              <Touch
                haptic="selection"
                onPress={() => patch({ captureDetail: !config.captureDetail })}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: space.md,
                  padding: space.lg,
                  borderRadius: radius.md,
                  backgroundColor: config.captureDetail ? c.brandTint : c.fill,
                }}
              >
                <Ionicons
                  name={config.captureDetail ? 'checkbox' : 'square-outline'}
                  size={20}
                  color={config.captureDetail ? c.brand : c.textTertiary}
                />
                <View style={{ flex: 1 }}>
                  <Text variant="bodyStrong">capture shot detail</Text>
                  <Text variant="caption" tone="secondary">
                    shot type and placement on scoring shots — feeds your kpis
                  </Text>
                </View>
              </Touch>
            </View>
          )}
        </ScrollView>

        <Footer>
          <Button label="pick squads" size="lg" full disabled={!ready} onPress={start} />
        </Footer>
      </KeyboardAvoidingView>
    </View>
  );
}

/* ---------------------------------------------------------------- shared */

export function Header({ title, onClose, right }: { title: string; onClose?: () => void; right?: React.ReactNode }) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  return (
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
      {onClose && <IconButton icon="chevron-back" size={34} onPress={onClose} />}
      <Text variant="heading" style={{ flex: 1 }} numberOfLines={1}>
        {title}
      </Text>
      {right}
    </View>
  );
}

export function Footer({ children }: { children: React.ReactNode }) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        paddingHorizontal: space.gutter,
        paddingTop: space.md,
        paddingBottom: Math.max(insets.bottom, space.lg),
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: c.hairline,
        backgroundColor: c.surface,
        gap: space.sm,
      }}
    >
      {children}
    </View>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
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

export function TeamInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const c = useColors();
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor={c.textTertiary}
      style={{
        ...type.body,
        color: c.text,
        backgroundColor: c.fill,
        borderRadius: radius.md,
        paddingHorizontal: space.lg,
        height: 46,
      }}
    />
  );
}
