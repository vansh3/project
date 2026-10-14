import { View, Text, StyleSheet } from "react-native";
import { useEffect } from "react";
import Animated, { BounceIn, ZoomIn, FadeIn } from "react-native-reanimated";
import Ionicons from "@react-native-vector-icons/ionicons";
import * as Haptics from "expo-haptics";

import { spacing, useTheme } from "../theme";

const SPARKLES: { top: number; left: number; size: number; delay: number }[] = [
  { top: -6, left: 6, size: 18, delay: 500 },
  { top: 10, left: 112, size: 14, delay: 650 },
  { top: 78, left: -4, size: 16, delay: 750 },
  { top: 92, left: 108, size: 20, delay: 600 },
];

/** Shown when a kid finishes any game — a gold medal + "Congratulations!" moment
 * so every completed game feels like a real achievement. */
export function GameMedal({ title = "Congratulations!" }: { title?: string }) {
  const { colors } = useTheme();
  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }, []);

  return (
    <View style={styles.wrap} testID="game-medal">
      <View style={styles.medalArea}>
        {SPARKLES.map((s, idx) => (
          <Animated.View key={idx} entering={FadeIn.delay(s.delay).duration(300)} style={[styles.sparkle, { top: s.top, left: s.left }]}>
            <Ionicons name="sparkles" size={s.size} color="#FFC94A" />
          </Animated.View>
        ))}
        <Animated.View entering={ZoomIn.delay(150).duration(400)} style={styles.glow} />
        <Animated.View entering={BounceIn.delay(250).duration(650)} style={styles.medal}>
          <View style={[styles.ribbon, styles.ribbonLeft]} />
          <View style={[styles.ribbon, styles.ribbonRight]} />
          <View style={styles.medalFace}>
            <Ionicons name="medal" size={50} color="#B8860B" />
          </View>
        </Animated.View>
      </View>
      <Animated.Text entering={FadeIn.delay(500).duration(400)} testID="game-medal-title" style={[styles.title, { color: colors.onSurface }]}>
        {title}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", marginBottom: spacing.sm },
  medalArea: { width: 128, height: 118, alignItems: "center", justifyContent: "flex-start" },
  sparkle: { position: "absolute" },
  glow: { position: "absolute", top: 4, width: 92, height: 92, borderRadius: 46, backgroundColor: "rgba(255,201,74,0.35)" },
  medal: { width: 92, height: 92, alignItems: "center", justifyContent: "center" },
  ribbon: { position: "absolute", width: 22, height: 40, top: -14, borderRadius: 3 },
  ribbonLeft: { left: 20, backgroundColor: "#E85D5D", transform: [{ rotate: "-16deg" }] },
  ribbonRight: { right: 20, backgroundColor: "#4A90D9", transform: [{ rotate: "16deg" }] },
  medalFace: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#FFD700",
    borderWidth: 4,
    borderColor: "#B8860B",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 24, fontWeight: "900", marginTop: spacing.sm, textAlign: "center" },
});
