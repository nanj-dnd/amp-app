import React, { useRef, useState } from 'react';
import { View, ScrollView, useWindowDimensions, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { Text } from '../ui/Text';
import { Touch } from '../ui/Pressable';
import { Button, IconButton } from '../ui/Button';
import { ScoreCard } from '../ui/ScoreCard';
import { useColors, space, radius, font } from '../theme';
import { useStore } from '../state/store';
import { components, composite } from '../ampScore';
import { currentReport } from '../reportData';
import { kpiIndex, tierOf } from '../report';

/**
 * the card, and getting it off the phone.
 *
 * capture is the whole point of this screen, so the card is rendered at a fixed
 * export width off to the side and captured from there — capturing the on-screen
 * copy would bake in whatever width the device happened to be, and the same card
 * would come out different on every phone.
 */
const EXPORT_WIDTH = 1080;

/** the age group this athlete plays in, from their age. */
function ageBandFor(years: number): string {
  for (const b of [9, 11, 13, 15, 17, 19]) if (years <= b) return `u${b}`;
  return 'open';
}

export function ShareCardScreen({ onClose }: { onClose: () => void }) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { profile, progression } = useStore();
  const [busy, setBusy] = useState(false);

  const exportRef = useRef<View>(null);

  const parts = components(progression);
  const score = composite(parts);
  const index = kpiIndex(tierOf(currentReport));
  const strength = index.get(currentReport.strengthId)?.name;

  const preview = Math.min(width - space.gutter * 2, 340);

  const card = (w: number) => (
    <ScoreCard
      width={w}
      name={profile.name || 'your name'}
      discipline={profile.discipline}
      club={profile.level}
      ageBand={ageBandFor(profile.ageYears)}
      score={score}
      components={parts}
      strength={strength}
    />
  );

  const share = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const uri = await captureRef(exportRef, { format: 'png', quality: 1, width: EXPORT_WIDTH });
      if (await Sharing.isAvailableAsync()) {
        // sdk 57: mimeType is android, UTI is ios. without the UTI ios guesses
        // the type and can hand the receiving app the wrong thing.
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          UTI: 'public.png',
          dialogTitle: 'your amp card',
        });
      } else {
        Alert.alert('saved', `card written to ${uri}`);
      }
    } catch (e) {
      Alert.alert("couldn't export", 'the card could not be rendered to an image on this device.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <View
        style={{
          paddingTop: insets.top + space.sm,
          paddingHorizontal: space.gutter,
          paddingBottom: space.sm,
          flexDirection: 'row',
          alignItems: 'center',
          gap: space.md,
        }}
      >
        <IconButton icon="chevron-back" size={34} onPress={onClose} />
        <Text variant="heading" style={{ flex: 1 }}>
          your card
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ alignItems: 'center', padding: space.gutter, gap: space.xl }}>
        {card(preview)}

        <View style={{ alignSelf: 'stretch', gap: space.sm }}>
          {parts.map((p) => (
            <View
              key={p.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: space.md,
                paddingHorizontal: space.lg,
                paddingVertical: space.md,
                borderRadius: radius.md,
                backgroundColor: c.surface,
              }}
            >
              <Text variant="callout" style={{ flex: 1 }}>
                {p.label}
              </Text>
              {p.score === null ? (
                <Text variant="caption" tone="tertiary">
                  {p.empty}
                </Text>
              ) : (
                <Text variant="callout" style={{ fontFamily: font.bold }}>
                  {String(p.score)}
                </Text>
              )}
              <Text variant="tab" tone="tertiary" style={{ width: 30, textAlign: 'right' }}>
                {`${p.weight}%`}
              </Text>
            </View>
          ))}
          <Text variant="caption" tone="tertiary">
            components you haven't used yet are left out of the average rather than counted as zero.
          </Text>
        </View>
      </ScrollView>

      <View
        style={{
          paddingHorizontal: space.gutter,
          paddingTop: space.md,
          paddingBottom: Math.max(insets.bottom, space.lg),
          backgroundColor: c.surface,
        }}
      >
        <Button
          label={busy ? 'exporting…' : Platform.OS === 'web' ? 'export is native only' : 'share your card'}
          icon="share-outline"
          size="lg"
          full
          loading={busy}
          disabled={Platform.OS === 'web'}
          onPress={share}
        />
      </View>

      {/* the export copy: rendered at a fixed width, parked off-screen */}
      <View style={{ position: 'absolute', left: -9999, top: 0 }} pointerEvents="none">
        <View ref={exportRef} collapsable={false}>
          {card(EXPORT_WIDTH)}
        </View>
      </View>
    </View>
  );
}
