import { View, Text, StyleSheet, Pressable } from "react-native";
import { useMemo, useRef, useState } from "react";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GameHeader } from "@/src/components/GameHeader";
import { GameMedal } from "@/src/components/GameMedal";
import { useTheme, spacing, radius } from "@/src/theme";
import { Button } from "@/src/components/Button";
import { saveProgress } from "@/src/progress";

const FEELINGS = [
  { name: "Happy", emoji: "😊" },
  { name: "Sad", emoji: "😢" },
  { name: "Angry", emoji: "😠" },
  { name: "Scared", emoji: "😨" },
  { name: "Surprised", emoji: "😲" },
  { name: "Excited", emoji: "🤩" },
  { name: "Worried", emoji: "😟" },
  { name: "Shy", emoji: "😳" },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildRound(target: (typeof FEELINGS)[number]) {
  const distractors = shuffle(FEELINGS.filter((f) => f.name !== target.name)).slice(0, 3);
  return shuffle([target, ...distractors]);
}

export default function FaceTheFeeling() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const order = useMemo(() => shuffle(FEELINGS), []);
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const savedRef = useRef(false);
  const done = i >= order.length;
  const target = order[i];
  const choices = useMemo(() => (target ? buildRound(target) : []), [target]);

  const pick = (name: string) => {
    if (picked || !target) return;
    setPicked(name);
    const ok = name === target.name;
    Haptics.notificationAsync(ok ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning).catch(() => {});
    if (ok) setScore((s) => s + 1);
    setTimeout(() => {
      setPicked(null);
      const next = i + 1;
      setI(next);
      if (next >= order.length && !savedRef.current) {
        savedRef.current = true;
        saveProgress("face-the-feeling", score + (ok ? 1 : 0));
      }
    }, 800);
  };

  const replay = () => {
    savedRef.current = false;
    setI(0);
    setScore(0);
    setPicked(null);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <GameHeader title="Face the Feeling" score={score} color={colors.kidPink} />
      {done ? (
        <View style={[styles.center, { paddingBottom: insets.bottom + spacing.xl }]}>
          <GameMedal title="Face Reader Champ!" />
          <Text testID="face-result" style={[styles.big, { color: colors.onSurface }]}>{score} / {order.length}</Text>
          <View style={{ width: "100%", marginTop: spacing.xl }}>
            <Button testID="face-replay" title="Play Again" onPress={replay} />
          </View>
        </View>
      ) : (
        <View style={{ flex: 1, padding: spacing.xl }}>
          <Text style={{ color: colors.muted, fontWeight: "700", marginBottom: spacing.md }}>Round {i + 1} of {order.length}</Text>
          <View style={[styles.wordBox, { backgroundColor: colors.kidPink }]}>
            <Text style={{ color: colors.onKid, fontSize: 15, opacity: 0.9 }}>Which face feels...</Text>
            <Text testID="face-word" style={[styles.word, { color: colors.onKid }]}>{target.name.toUpperCase()}</Text>
          </View>
          <View style={styles.grid}>
            {choices.map((c) => {
              const isPicked = picked === c.name;
              const correct = picked && c.name === target.name;
              const bg = correct ? colors.success : isPicked ? colors.error : colors.surfaceSecondary;
              return (
                <Pressable
                  key={c.name}
                  testID={`face-option-${c.name.toLowerCase()}`}
                  onPress={() => pick(c.name)}
                  style={[styles.cell, { backgroundColor: bg, borderColor: correct ? colors.kidSun : colors.border, opacity: picked && !correct && !isPicked ? 0.45 : 1 }]}
                >
                  <Text style={styles.emoji}>{c.emoji}</Text>
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
  wordBox: { borderRadius: radius.lg, padding: spacing.xl, alignItems: "center", marginBottom: spacing.xl },
  word: { fontSize: 30, fontWeight: "900", marginTop: spacing.xs, letterSpacing: 1 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: spacing.md },
  cell: { width: "48%", height: 120, borderRadius: radius.lg, borderWidth: 3, alignItems: "center", justifyContent: "center" },
  emoji: { fontSize: 56 },
});
