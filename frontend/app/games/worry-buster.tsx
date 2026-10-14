import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import Ionicons from "@react-native-vector-icons/ionicons";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GameHeader } from "@/src/components/GameHeader";
import { GameMedal } from "@/src/components/GameMedal";
import { useTheme, spacing, radius } from "@/src/theme";
import { Button } from "@/src/components/Button";
import { saveProgress } from "@/src/progress";
import { useAuth } from "@/src/auth";

// Advanced self-regulation game: pick the coping strategy that best helps with
// each worry, scored 0/1/2 like Empathy Challenge but focused on calming the self.
const WORRIES: { text: string; options: { label: string; points: 0 | 1 | 2 }[] }[] = [
  {
    text: "You're worried about a big test tomorrow.",
    options: [
      { label: "Take deep breaths and review for a little while", points: 2 },
      { label: "Worry about it all night without sleeping", points: 0 },
      { label: "Tell yourself 'it'll be fine' and do nothing else", points: 1 },
    ],
  },
  {
    text: "You feel nervous before your first soccer game.",
    options: [
      { label: "Hide in the locker room until it's over", points: 0 },
      { label: "Quietly worry and say nothing to anyone", points: 1 },
      { label: "Stretch and remind yourself you've practiced", points: 2 },
    ],
  },
  {
    text: "You're scared of the dark at bedtime.",
    options: [
      { label: "Turn on a nightlight and hug your favorite toy", points: 2 },
      { label: "Pull the blanket over your head and stay still", points: 1 },
      { label: "Stay awake all night feeling scared", points: 0 },
    ],
  },
  {
    text: "You're worried your friend might be upset with you.",
    options: [
      { label: "Avoid them and assume the worst", points: 0 },
      { label: "Wait quietly and hope it goes away", points: 1 },
      { label: "Ask them calmly if everything is okay", points: 2 },
    ],
  },
  {
    text: "You feel nervous meeting new kids at camp.",
    options: [
      { label: "Stay by yourself the whole time", points: 0 },
      { label: "Take a deep breath and say hi with a smile", points: 2 },
      { label: "Wait for someone else to talk first", points: 1 },
    ],
  },
  {
    text: "You're worried about forgetting your lines in the school play.",
    options: [
      { label: "Decide not to try your best", points: 0 },
      { label: "Just hope you don't mess up", points: 1 },
      { label: "Practice your lines and remember mistakes are okay", points: 2 },
    ],
  },
  {
    text: "You feel anxious about a thunderstorm outside.",
    options: [
      { label: "Panic and cry under the table", points: 0 },
      { label: "Breathe slowly and do something cozy indoors", points: 2 },
      { label: "Just wait quietly feeling scared", points: 1 },
    ],
  },
];

function feedbackFor(points: 0 | 1 | 2) {
  if (points === 2) return { text: "Great coping tool! +2", good: true };
  if (points === 1) return { text: "That's okay, but there's a calmer way. +1", good: false };
  return { text: "That might make the worry bigger. Try again next time.", good: false };
}

export default function WorryBuster() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const locked = !user?.premium && user?.role !== "admin";
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const savedRef = useRef(false);
  const total = WORRIES.length * 2;
  const done = i >= WORRIES.length;
  const stars = Math.round((score / total) * 3);

  useEffect(() => {
    if (locked) router.replace("/paywall");
  }, [locked, router]);

  if (locked) return null;

  const choose = (idx: number) => {
    if (picked !== null) return;
    const pts = WORRIES[i].options[idx].points;
    setPicked(idx);
    setScore((s) => s + pts);
    Haptics.notificationAsync(pts === 2 ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning).catch(() => {});
  };

  const next = () => {
    const n = i + 1;
    setPicked(null);
    setI(n);
    if (n >= WORRIES.length && !savedRef.current) {
      savedRef.current = true;
      saveProgress("worry-buster", score);
    }
  };

  const replay = () => {
    savedRef.current = false;
    setI(0);
    setScore(0);
    setPicked(null);
  };

  const fb = picked !== null ? feedbackFor(WORRIES[i].options[picked].points) : null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <GameHeader title="Worry Buster" score={score} color={colors.kidMint} />
      {done ? (
        <View style={[styles.center, { paddingBottom: insets.bottom + spacing.xl }]}>
          <GameMedal title="Worry Buster Champion!" />
          <View style={{ flexDirection: "row", gap: 4 }}>
            {[0, 1, 2].map((k) => <Ionicons key={k} name={k < stars ? "star" : "star-outline"} size={32} color={colors.brandSecondary} />)}
          </View>
          <Text style={{ color: colors.onSurfaceTertiary, fontSize: 16, textAlign: "center", marginTop: spacing.sm }}>You scored {score} of {total} calm-down points</Text>
          <View style={{ width: "100%", marginTop: spacing.xl }}>
            <Button testID="worry-replay" title="Play Again" onPress={replay} />
          </View>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: insets.bottom + spacing.xl }}>
          <Text style={{ color: colors.muted, fontWeight: "700", marginBottom: spacing.md }}>Worry {i + 1} of {WORRIES.length}</Text>
          <Animated.View key={`q-${i}`} entering={FadeIn} style={[styles.qBox, { backgroundColor: colors.kidMint }]}>
            <Ionicons name="cloud" size={30} color={colors.onKid} />
            <Text testID="worry-text" style={[styles.qText, { color: colors.onKid }]}>{WORRIES[i].text}</Text>
            <Text style={{ color: colors.onKid, opacity: 0.85, marginTop: spacing.sm }}>What's the best way to feel better?</Text>
          </Animated.View>
          {WORRIES[i].options.map((o, idx) => {
            const chosen = picked === idx;
            const dim = picked !== null && !chosen;
            return (
              <Pressable
                key={o.label}
                testID={`worry-option-${idx}`}
                onPress={() => choose(idx)}
                style={[
                  styles.opt,
                  {
                    backgroundColor: colors.surfaceSecondary,
                    borderColor: chosen ? (o.points === 2 ? colors.success : o.points === 1 ? colors.kidSun : colors.error) : colors.border,
                    opacity: dim ? 0.5 : 1,
                  },
                ]}
              >
                <Text style={{ fontSize: 16, fontWeight: "700", color: colors.onSurface, flex: 1 }}>{o.label}</Text>
                {chosen ? (
                  <Ionicons
                    name={o.points === 2 ? "leaf" : o.points === 1 ? "information-circle" : "close-circle"}
                    size={22}
                    color={o.points === 2 ? colors.success : o.points === 1 ? colors.brandSecondary : colors.error}
                  />
                ) : null}
              </Pressable>
            );
          })}
          {fb && (
            <View style={{ marginTop: spacing.lg }}>
              <Text testID="worry-feedback" style={{ fontSize: 16, fontWeight: "800", color: fb.good ? colors.success : colors.onSurfaceTertiary, marginBottom: spacing.md, textAlign: "center" }}>
                {fb.text}
              </Text>
              <Button testID="worry-next" title={i + 1 >= WORRIES.length ? "See Results" : "Next Worry"} onPress={next} />
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl },
  qBox: { borderRadius: radius.lg, padding: spacing.xl, marginBottom: spacing.lg },
  qText: { fontSize: 18, fontWeight: "800", marginTop: spacing.md, lineHeight: 25 },
  opt: { minHeight: 60, borderRadius: radius.lg, borderWidth: 2.5, paddingHorizontal: spacing.lg, flexDirection: "row", alignItems: "center", marginBottom: spacing.md, gap: spacing.sm },
});
