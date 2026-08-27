import React, { useState } from 'react';
import { View, KeyboardAvoidingView, Platform, TextInput, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen, Section } from '../ui/Screen';
import { Card } from '../ui/Card';
import { Text } from '../ui/Text';
import { Touch } from '../ui/Pressable';
import { IconButton } from '../ui/Button';
import { LogoMark } from '../ui/Logo';
import { useColors, space, radius, type } from '../theme';
import { TAB_BAR_SPACE } from '../ui/TabBar';
import { chats, suggestions } from '../data';

/** list of past threads. */
export function AskScreen({ go, onClose }: { go: (r: string) => void; onClose?: () => void }) {
  const c = useColors();
  return (
    <Screen
      title="ask amp"
      onBack={onClose}
      right={<IconButton icon="create-outline" kind="primary" onPress={() => go('thread')} />}
    >
      <Section>
        {chats.map((t) => (
          <Card key={t.id} onPress={() => go('thread')} style={{ paddingVertical: space.lg }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: radius.sm,
                  backgroundColor: c.brandTint,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons
                  name={t.video ? 'videocam' : 'chatbubble-ellipses-outline'}
                  size={17}
                  color={c.brand}
                />
              </View>
              {/* one line per thread. the title and the first reply were saying
                  the same thing in two sizes. */}
              <Text variant="callout" style={{ flex: 1 }} numberOfLines={1}>
                {t.title}
              </Text>
              <Text variant="caption" tone="tertiary">
                {t.date}
              </Text>
            </View>
          </Card>
        ))}
      </Section>
    </Screen>
  );
}

/** a single conversation — empty state + composer. */
export function ThreadScreen({ back }: { back: () => void }) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState('');

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      {/* modal-style header: back on the left, mark in the middle */}
      <View
        style={{
          paddingTop: insets.top + space.sm,
          paddingBottom: space.md,
          paddingHorizontal: space.gutter,
          flexDirection: 'row',
          alignItems: 'center',
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: c.hairline,
        }}
      >
        <IconButton icon="chevron-back" onPress={back} size={34} />
        <View style={{ flex: 1, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
          <LogoMark size={16} />
          <Text variant="heading">ask amp</Text>
        </View>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: space.gutter }}>
        <View style={{ alignItems: 'center', gap: space.md, marginBottom: space.xxl }}>
          <LogoMark size={40} />
          <Text variant="title" align="center">
            ask your game anything
          </Text>
        </View>

        <View style={{ gap: space.sm }}>
          {suggestions.map((s) => (
            <Touch
              key={s}
              onPress={() => setDraft(s)}
              style={{
                paddingVertical: space.md,
                paddingHorizontal: space.lg,
                borderRadius: radius.md,
                backgroundColor: c.surface,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: c.hairline,
                flexDirection: 'row',
                alignItems: 'center',
                gap: space.md,
              }}
            >
              <Text variant="callout" style={{ flex: 1 }}>
                {s}
              </Text>
              <Ionicons name="arrow-up-circle" size={18} color={c.textTertiary} />
            </Touch>
          ))}
        </View>
      </ScrollView>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            gap: space.sm,
            paddingHorizontal: space.gutter,
            paddingTop: space.md,
            paddingBottom: Math.max(insets.bottom, space.md),
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: c.hairline,
            backgroundColor: c.surface,
          }}
        >
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="ask about your game…"
            placeholderTextColor={c.textTertiary}
            multiline
            style={{
              ...type.body,
              flex: 1,
              maxHeight: 120,
              color: c.text,
              backgroundColor: c.fill,
              borderRadius: radius.lg,
              paddingHorizontal: space.lg,
              paddingTop: space.md,
              paddingBottom: space.md,
            }}
          />
          <IconButton icon="arrow-up" kind="primary" size={40} disabled={!draft.trim()} />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
