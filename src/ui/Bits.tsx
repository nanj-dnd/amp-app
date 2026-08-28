import React from 'react';
import { View, Image, TextInput, StyleSheet, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors, radius, space, type } from '../theme';
import { Text } from './Text';
import { GlossText } from './GlossText';
import { Card } from './Card';
import { Touch } from './Pressable';

/** the 2x2 metric grid on progress. */
export function StatTile({
  value,
  label,
  sub,
  tone,
}: {
  value: string;
  label: string;
  sub?: string;
  tone?: string;
}) {
  return (
    <Card style={{ flex: 1, paddingVertical: space.xl, paddingHorizontal: space.lg }}>
      {/* a tinted stat is struck; an untinted one is body text and stays flat */}
      {tone ? (
        <GlossText variant="title" color={tone}>
          {value}
        </GlossText>
      ) : (
        <Text variant="title">{value}</Text>
      )}
      <Text variant="caption" tone="secondary" style={{ marginTop: 4 }}>
        {label}
      </Text>
      {sub && (
        <Text variant="caption" tone="tertiary" style={{ marginTop: 1 }}>
          {sub}
        </Text>
      )}
    </Card>
  );
}

export function TileRow({ children }: { children: React.ReactNode }) {
  return <View style={{ flexDirection: 'row', gap: space.md }}>{children}</View>;
}

/** navigable list row with a chevron. */
export function Row({
  title,
  subtitle,
  meta,
  left,
  onPress,
  chevron = true,
}: {
  title: string;
  subtitle?: string;
  meta?: string;
  left?: React.ReactNode;
  onPress?: () => void;
  chevron?: boolean;
}) {
  const c = useColors();
  return (
    <Card onPress={onPress} style={{ paddingVertical: space.lg, paddingHorizontal: space.lg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
        {left}
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="bodyStrong" numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text variant="callout" tone="secondary" numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
        {meta && (
          <Text variant="caption" tone="tertiary">
            {meta}
          </Text>
        )}
        {chevron && <Ionicons name="chevron-forward" size={16} color={c.textTertiary} />}
      </View>
    </Card>
  );
}

export function Avatar({ uri, size = 44, name }: { uri?: string; size?: number; name?: string }) {
  const c = useColors();
  const initials = (name ?? '')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toLowerCase();

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: c.brandTint,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {uri ? (
        <Image source={{ uri }} style={{ width: size, height: size }} />
      ) : (
        <Text variant="bodyStrong" tone="brand" style={{ fontSize: size * 0.34 }}>
          {initials}
        </Text>
      )}
    </View>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  const c = useColors();
  return (
    <View style={{ alignItems: 'center', paddingVertical: space.xxxl, gap: space.sm }}>
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: c.fill,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: space.xs,
        }}
      >
        <Ionicons name={icon} size={24} color={c.textTertiary} />
      </View>
      <Text variant="heading">{title}</Text>
      <Text variant="callout" tone="secondary" align="center" style={{ maxWidth: 260 }}>
        {body}
      </Text>
      {action && <View style={{ marginTop: space.md }}>{action}</View>}
    </View>
  );
}

/** labelled form field wrapper — one label style for the whole app. */
export function Field({ label, children, style }: { label: string; children: React.ReactNode; style?: ViewStyle }) {
  return (
    <View style={[{ gap: space.sm }, style]}>
      <Text variant="caption" tone="secondary">
        {label}
      </Text>
      {children}
    </View>
  );
}

export function Input({
  value,
  onChangeText,
  placeholder,
  multiline,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  const c = useColors();
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={c.textTertiary}
      multiline={multiline}
      style={{
        ...type.body,
        color: c.text,
        backgroundColor: c.fill,
        borderRadius: radius.md,
        paddingHorizontal: space.lg,
        paddingVertical: space.md,
        minHeight: 46,
      }}
    />
  );
}

/** upload slot for the analyze screen. */
export function UploadSlot({
  index,
  filled,
  onPress,
}: {
  index: number;
  filled?: boolean;
  onPress?: () => void;
}) {
  const c = useColors();
  return (
    <Touch onPress={onPress} haptic="light">
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: space.md,
          padding: space.md,
          borderRadius: radius.md,
          backgroundColor: filled ? c.brandTint : c.fill,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: filled ? c.brandBorder : 'transparent',
        }}
      >
        <View
          style={{
            width: 42,
            height: 42,
            borderRadius: radius.sm,
            backgroundColor: c.surface,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons
            name={filled ? 'checkmark' : 'arrow-up-circle-outline'}
            size={20}
            color={filled ? c.brand : c.textTertiary}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong">{`clip ${index}`}</Text>
          <Text variant="caption" tone={filled ? 'brand' : 'tertiary'}>
            {filled ? 'ready' : index === 1 ? 'side-on · required' : 'front-on · optional'}
          </Text>
        </View>
      </View>
    </Touch>
  );
}
