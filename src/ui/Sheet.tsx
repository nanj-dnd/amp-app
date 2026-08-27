import React, { useEffect, useRef } from 'react';
import { View, Modal, Animated, Easing, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors, space, radius } from '../theme';

/**
 * every bottom sheet in the app.
 *
 * these used to be absolutely-positioned views inside whichever screen opened
 * them, which put them *under* the tab bar — the tab bar is a later sibling in
 * the tree, so it painted on top and clipped the bottom of every sheet.
 * a real Modal renders above the whole app, which is the only reliable way to
 * do this in react native; there are no portals.
 */
export function Sheet({
  onClose,
  children,
  /** sheets whose content can outgrow the screen get their own scroll view */
  scroll = false,
  maxHeightRatio = 0.86,
}: {
  onClose: () => void;
  children: React.ReactNode;
  scroll?: boolean;
  maxHeightRatio?: number;
}) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const slide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(slide, {
      toValue: 1,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [slide]);

  const panel = (
    <Animated.View
      style={{
        backgroundColor: c.surface,
        borderTopLeftRadius: radius.xl,
        borderTopRightRadius: radius.xl,
        paddingTop: space.md,
        paddingBottom: Math.max(insets.bottom, space.lg),
        maxHeight: `${maxHeightRatio * 100}%`,
        opacity: slide,
        transform: [{ translateY: slide.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }],
      }}
    >
      <View
        style={{
          alignSelf: 'center',
          width: 36,
          height: 4,
          borderRadius: 2,
          backgroundColor: c.fillStrong,
          marginBottom: space.sm,
        }}
      />
      {scroll ? (
        <ScrollView
          // the fixed variant gets its rhythm from `gap`; the scrolling one was
          // missing it, so every scrolling sheet came out cramped
          contentContainerStyle={{ paddingHorizontal: space.gutter, paddingBottom: space.lg, gap: space.lg }}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={{ paddingHorizontal: space.gutter, gap: space.lg }}>{children}</View>
      )}
    </Animated.View>
  );

  return (
    <Modal transparent visible animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.42)' }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        {panel}
      </View>
    </Modal>
  );
}

/** full-screen cover, for the exercise picker and anything else list-shaped. */
export function FullSheet({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  const c = useColors();
  return (
    <Modal transparent={false} visible animationType="slide" onRequestClose={onClose}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: c.bg }]}>{children}</View>
    </Modal>
  );
}
