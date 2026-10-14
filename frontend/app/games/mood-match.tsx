import { View, Text, StyleSheet, Pressable } from "react-native";
import { useMemo, useState } from "react";
import * as Haptics from "expo-haptics";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GameHeader } from "@/src/components/GameHeader";
import { useTheme, spacing, radius } from "@/src/theme";
import { Button } from "@/src/components/Button";
import { saveProgress } from "@/src/progress";

const ROUNDS = [
  { situation: "Your friend shared their toy with you.", answer: "Happy" },
  { situation: "Your ice cream fell on the ground.", answer: "Sad" },
  { situation: "Someone took your turn on the swing.", answer: "Angry" },
  { situation: "There is a loud thunder at night.", answer: "Scared" },
  { situation: "You got a surprise birthday gift!", answer: "Surprised" },
  { situation: "You finished your puzzle all by yourself.", answer: "Happy" },
];

const FEELINGS = [
  { name: "Happy", icon: "happy-outline", color: "kidSun" },
  { name: "Sad", icon: "sad-outline", color: "kidSky" },
  { name: "Angry", icon: "flame-outline", color: "kidCoral" },
  { name: "Scared", icon: "alert-circle-outline", color: "kidMint" },
  { name: "Surprised", icon: "sparkles-outline", color: "kidPink" },
] as const;

export default function MoodMatch() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const done = i >= ROUNDS.length;
  const round = ROUNDS[i];
  const options = useMemo(() => FEELINGS, []);

  const pick = (name: string) => {
    if (picked) return;
    setPicked(name);
    const ok = name === round.answer;
    Haptics.notificationAsync(ok ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning).catch(() => {});
    if (ok) setScore((s) => s + 1);
    setTimeout(() => {
      setPicked(null);
      const next = i + 1;
      setI(next);
      if (next >= ROUNDS.length) saveProgress("mood-match", score + (ok ? 1 : 0));
    }, 900);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <GameHeader title="Mood Match" score={score} color={colors.kidCoral} />
      {done ? (
        <View style={[styles.center, { paddingBottom: insets.bottom + spacing.xl }]}>
          <Ionicons name="trophy" size={96} color={colors.brandSecondary} />
          <Text testID="mood-match-result" style={[styles.big, { color: colors.onSurface }]}>{score} / {ROUNDS.length}</Text>
          <Text style={[styles.msg, { color: colors.onSurfaceTertiary }]}>Great job reading feelings!</Text>
          <View style={{ width: "100%", marginTop: spacing.xl }}>
            <Button testID="mood-match-replay" title="Play Again" onPress={() => { setI(0); setScore(0); }} />
          </View>
        </View>
      ) : (
        <View style={{ flex: 1, padding: spacing.xl }}>
          <Text style={[styles.progress, { color: colors.muted }]}>Question {i + 1} of {ROUNDS.length}</Text>
          <View style={[styles.situation, { backgroundColor: colors.kidSky }]}>
            <Text testID="mood-match-situation" style={[styles.sitText, { color: colors.onKid }]}>{round.situation}</Text>
            <Text style={{ color: colors.onKid, marginTop: spacing.md, opacity: 0.9 }}>How would you feel?</Text>
          </View>
          <View style={styles.grid}>
            {options.map((f) => {
              const isPicked = picked === f.name;
              const correct = picked && f.name === round.answer;
              const bg = correct ? colors.success : isPicked ? colors.error : colors[f.color];
              const fg = colors.onKid;
              return (
                <Pressable
                  key={f.name}
                  testID={`mood-option-${f.name.toLowerCase()}`}
                  onPress={() => pick(f.name)}
                  style={[styles.option, { backgroundColor: bg, borderColor: correct ? colors.kidSun : "transparent", opacity: picked && !correct && !isPicked ? 0.45 : 1 }]}
                >
                  <Ionicons name={f.icon as any} size={40} color={fg} />
                  <Text style={[styles.optText, { color: fg }]}>{f.name}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl },
  big: { fontSize: 48, fontWeight: "800", marginTop: spacing.lg },
  msg: { fontSize: 16, marginTop: spacing.sm },
  progress: { fontSize: 13, fontWeight: "700", marginBottom: spacing.md },
  situation: { borderRadius: radius.lg, padding: spacing.xl, marginBottom: spacing.xl },
  sitText: { fontSize: 22, fontWeight: "800", lineHeight: 30 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md, justifyContent: "space-between" },
  option: { width: "47%", height: 110, borderRadius: radius.lg, alignItems: "center", justifyContent: "center", borderWidth: 4 },
  optText: { fontSize: 16, fontWeight: "800", marginTop: spacing.sm },
});
