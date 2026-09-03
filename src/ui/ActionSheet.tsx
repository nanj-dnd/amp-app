import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './Text';
import { Touch } from './Pressable';
import { Sheet, useSheetDismiss } from './Sheet';
import { useColors, space, radius } from '../theme';

export type Action = {
  id: string;
  label: string;
  detail: string;
  icon: keyof typeof Ionicons.glyphMap;
  primary?: boolean;
};

/**
 * the [+] is now three things — film a session, score a match, log a workout —
 * so it opens a sheet instead of jumping straight to one screen. three items is
 * the ceiling; a fourth means something belongs in the tab bar instead.
 */
export function ActionSheet({
  actions,
  onPick,
  onClose,
}: {
  actions: Action[];
  onPick: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <Sheet onClose={onClose}>
      <Actions actions={actions} onPick={onPick} />
    </Sheet>
  );
}

/**
 * inside the sheet, so it can close it along the same path a drag would —
 * picking an action should look like pushing the sheet away, not like the
 * sheet being deleted.
 */
function Actions({ actions, onPick }: { actions: Action[]; onPick: (id: string) => void }) {
  const c = useColors();
  const dismiss = useSheetDismiss();

  return (
      <View style={{ gap: space.sm }}>
        {actions.map((a) => (
          <Touch
            key={a.id}
            haptic="light"
            onPress={() => dismiss(() => onPick(a.id))}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: space.md,
              padding: space.lg,
              borderRadius: radius.md,
              backgroundColor: a.primary ? c.brandTint : c.fill,
              borderWidth: a.primary ? 1.5 : 0,
              borderColor: c.brandBorder,
            }}
          >
            <View
              style={{
                width: 42,
                height: 42,
                borderRadius: 21,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: a.primary ? c.brand : c.surface,
              }}
            >
              <Ionicons name={a.icon} size={20} color={a.primary ? c.textOnBrand : c.textSecondary} />
            </View>
            <View style={{ flex: 1, gap: 1 }}>
              <Text variant="bodyStrong" tone={a.primary ? 'brand' : 'primary'}>
                {a.label}
              </Text>
              <Text variant="caption" tone="secondary">
                {a.detail}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={15} color={c.textTertiary} />
          </Touch>
        ))}
      </View>
  );
}
