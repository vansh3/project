import { View, Text, StyleSheet, Pressable } from "react-native";
import { useState } from "react";
import * as Haptics from "expo-haptics";
import Ionicons from "@react-native-vector-icons/ionicons";
import Animated, { ZoomIn, BounceIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GameHeader } from "@/src/components/GameHeader";
import { useTheme, spacing, radius, ThemeColors } from "@/src/theme";
import { Button } from "@/src/components/Button";
import { saveProgress } from "@/src/progress";
import { GameMedal } from "@/src/components/GameMedal";

type K = keyof ThemeColors;
// Each feeling has a color, like a feelings color wheel
const FEELINGS: { name: string; color: K; icon: string; scene: string }[] = [
  { name: "Happy", color: "kidSun", icon: "sunny", scene: "You are playing at the park with friends." },
  { name: "Calm", color: "kidSky", icon: "water", scene: "You are lying down watching soft clouds." },
  { name: "Angry", color: "kidCoral", icon: "flame", scene: "Someone broke your sandcastle on purpose." },
  { name: "Loved", color: "kidPink", icon: "heart", scene: "Grandma gives you a big warm hug." },
  { name: "Brave", color: "kidOrange", icon: "shield", scene: "You try the big slide for the first time." },
  { name: "Peaceful", color: "kidLime", icon: "leaf", scene: "You are smelling flowers in the garden." },
];

function shuffle<T>(a: T[]): T[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
  return r;
}

export default function ColorMood() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [rounds, setRounds] = useState(() => shuffle(FEELINGS));
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const done = i >= rounds.length;
  const round = rounds[i];

  const pick = (name: string) => {
    if (picked) return;
    setPicked(name);
    const ok = name === round.name;
    Haptics.notificationAsync(ok ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning).catch(() => {});
    const ns = score + (ok ? 1 : 0);
    if (ok) setScore(ns);
    setTimeout(() => {
      setPicked(null);
      setI(i + 1);
      if (i + 1 >= rounds.length) saveProgress("color-mood", ns);
    }, 1100);
  };

  const replay = () => { setRounds(shuffle(FEELINGS)); setI(0); setScore(0); };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <GameHeader title="Color My Mood" score={score} color={colors.kidPink} />
      {done ? (
        <View style={[styles.center, { paddingBottom: insets.bottom + spacing.xl }]}>
          <GameMedal title="You painted a rainbow of feelings!" />
          <View style={styles.paletteRow}>
            {FEELINGS.map((f, k) => (
              <Animated.View key={f.name} entering={BounceIn.delay(k * 100)} style={[styles.paint, { backgroundColor: colors[f.color] }]} />
            ))}
          </View>
          <Text testID="color-mood-result" style={[styles.big, { color: colors.onSurface }]}>{score} / {rounds.length}</Text>
          <View style={{ width: "100%", marginTop: spacing.xl }}>
            <Button testID="color-mood-replay" title="Paint Again" onPress={replay} />
          </View>
        </View>
      ) : (
        <View style={{ flex: 1, padding: spacing.xl }}>
          <Text style={{ color: colors.muted, fontWeight: "700", marginBottom: spacing.md }}>Picture {i + 1} of {rounds.length}</Text>
          <Animated.View key={i} entering={ZoomIn} style={[styles.scene, { backgroundColor: picked ? colors[round.color] : colors.surfaceTertiary }]}>
            <Ionicons name={picked ? (round.icon as any) : "help-circle"} size={56} color={picked ? colors.onKid : colors.muted} />
            <Text testID="color-mood-scene" style={[styles.sceneText, { color: picked ? colors.onKid : colors.onSurface }]}>{round.scene}</Text>
            <Text style={{ color: picked ? colors.onKid : colors.onSurfaceTertiary, marginTop: spacing.sm, fontWeight: "700" }}>
              {picked ? (picked === round.name ? `Yes! ${round.name}!` : `It feels ${round.name}`) : "Which color is this feeling?"}
            </Text>
          </Animated.View>
          <View style={styles.grid}>
            {FEELINGS.map((f) => (
              <Pressable
                key={f.name}
                testID={`color-option-${f.name.toLowerCase()}`}
                onPress={() => pick(f.name)}
                style={({ pressed }) => [
                  styles.swatch,
                  { backgroundColor: colors[f.color], transform: [{ scale: pressed ? 0.92 : 1 }], opacity: picked && picked !== f.name && f.name !== round.name ? 0.4 : 1 },
                ]}
              >
                <Ionicons name={f.icon as any} size={28} color={colors.onKid} />
                <Text style={[styles.swatchText, { color: colors.onKid }]}>{f.name}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl },
  paletteRow: { flexDirection: "row", gap: spacing.sm },
  paint: { width: 40, height: 40, borderRadius: 20 },
  big: { fontSize: 48, fontWeight: "900", marginTop: spacing.lg },
  scene: { borderRadius: radius.lg, padding: spacing.xl, alignItems: "center", marginBottom: spacing.xl, minHeight: 200, justifyContent: "center" },
  sceneText: { fontSize: 20, fontWeight: "800", textAlign: "center", marginTop: spacing.md, lineHeight: 28 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: spacing.md },
  swatch: { width: "31%", height: 96, borderRadius: radius.lg, alignItems: "center", justifyContent: "center" },
  swatchText: { fontSize: 14, fontWeight: "900", marginTop: 4 },
});
