import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import Ionicons from "@react-native-vector-icons/ionicons";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GameHeader } from "@/src/components/GameHeader";
import { useTheme, spacing, radius } from "@/src/theme";
import { Button } from "@/src/components/Button";
import { saveProgress } from "@/src/progress";
import { useAuth } from "@/src/auth";
import { GameMedal } from "@/src/components/GameMedal";

// Advanced empathy/decision game: kids weigh THREE responses to a social
// situation, ranked by emotional intelligence rather than simple right/wrong.
const SITUATIONS: { text: string; options: { label: string; points: 0 | 1 | 2 }[] }[] = [
  {
    text: "Your friend didn't get invited to a birthday party and looks sad at lunch.",
    options: [
      { label: "Sit with them and ask if they're okay", points: 2 },
      { label: "Talk about the party loudly nearby", points: 0 },
      { label: "Say nothing and eat your lunch", points: 1 },
    ],
  },
  {
    text: "A classmate got a lower score on a test than you did.",
    options: [
      { label: "Tell them your score to compare", points: 0 },
      { label: "Say 'good job trying' and move on", points: 1 },
      { label: "Offer to study together next time", points: 2 },
    ],
  },
  {
    text: "Your sibling is scared of the dark during a storm.",
    options: [
      { label: "Tell them it's silly to be scared", points: 0 },
      { label: "Stay in the room with them for a bit", points: 2 },
      { label: "Turn on the TV and ignore them", points: 1 },
    ],
  },
  {
    text: "A new kid at school is sitting alone during recess.",
    options: [
      { label: "Wave but keep playing with your friends", points: 1 },
      { label: "Invite them to join your game", points: 2 },
      { label: "Point and whisper to your friends", points: 0 },
    ],
  },
  {
    text: "Your friend is upset because they lost their favorite toy.",
    options: [
      { label: "Say 'it's just a toy, get over it'", points: 0 },
      { label: "Help them look for it", points: 2 },
      { label: "Offer to lend them one of yours", points: 1 },
    ],
  },
  {
    text: "Someone in your group made a mistake during a team game.",
    options: [
      { label: "Blame them in front of everyone", points: 0 },
      { label: "Say 'it's okay, let's try again together'", points: 2 },
      { label: "Stay quiet and keep playing", points: 1 },
    ],
  },
  {
    text: "Your friend is nervous about reading out loud in class.",
    options: [
      { label: "Whisper 'you can do it, I believe in you'", points: 2 },
      { label: "Laugh if they stumble on a word", points: 0 },
      { label: "Look away and wait for your turn", points: 1 },
    ],
  },
];

function feedbackFor(points: 0 | 1 | 2) {
  if (points === 2) return { text: "That's a kind, caring choice! +2", good: true };
  if (points === 1) return { text: "That's okay, but there's a kinder way. +1", good: false };
  return { text: "That might hurt their feelings. Try again next time.", good: false };
}

export default function EmpathyChallenge() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const locked = !user?.premium && user?.role !== "admin";
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const savedRef = useRef(false);
  const total = SITUATIONS.length * 2;
  const done = i >= SITUATIONS.length;
  const stars = Math.round((score / total) * 3);

  useEffect(() => {
    if (locked) router.replace("/paywall");
  }, [locked, router]);

  if (locked) return null;

  const choose = (idx: number) => {
    if (picked !== null) return;
    const pts = SITUATIONS[i].options[idx].points;
    setPicked(idx);
    setScore((s) => s + pts);
    Haptics.notificationAsync(pts === 2 ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning).catch(() => {});
  };

  const next = () => {
    const n = i + 1;
    setPicked(null);
    setI(n);
    if (n >= SITUATIONS.length && !savedRef.current) {
      savedRef.current = true;
      saveProgress("empathy-challenge", score);
    }
  };

  const replay = () => {
    savedRef.current = false;
    setI(0);
    setScore(0);
    setPicked(null);
  };

  const fb = picked !== null ? feedbackFor(SITUATIONS[i].options[picked].points) : null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <GameHeader title="Empathy Challenge" score={score} color={colors.kidLime} />
      {done ? (
        <View style={[styles.center, { paddingBottom: insets.bottom + spacing.xl }]}>
          <GameMedal title="Empathy Champion!" />
          <View style={{ flexDirection: "row", gap: 4 }}>
            {[0, 1, 2].map((k) => <Ionicons key={k} name={k < stars ? "star" : "star-outline"} size={32} color={colors.brandSecondary} />)}
          </View>
          <Text style={{ color: colors.onSurfaceTertiary, fontSize: 16, textAlign: "center", marginTop: spacing.sm }}>You scored {score} of {total} kindness points</Text>
          <View style={{ width: "100%", marginTop: spacing.xl }}>
            <Button testID="empathy-replay" title="Play Again" onPress={replay} />
          </View>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: insets.bottom + spacing.xl }}>
          <Text style={{ color: colors.muted, fontWeight: "700", marginBottom: spacing.md }}>Situation {i + 1} of {SITUATIONS.length}</Text>
          <Animated.View key={`q-${i}`} entering={FadeIn} style={[styles.qBox, { backgroundColor: colors.kidLime }]}>
            <Ionicons name="people-circle" size={32} color={colors.onKidLight} />
            <Text testID="empathy-text" style={[styles.qText, { color: colors.onKidLight }]}>{SITUATIONS[i].text}</Text>
            <Text style={{ color: colors.onKidLight, opacity: 0.85, marginTop: spacing.sm }}>What's the kindest thing to do?</Text>
          </Animated.View>
          {SITUATIONS[i].options.map((o, idx) => {
            const chosen = picked === idx;
            const dim = picked !== null && !chosen;
            return (
              <Pressable
                key={o.label}
                testID={`empathy-option-${idx}`}
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
                    name={o.points === 2 ? "heart" : o.points === 1 ? "information-circle" : "close-circle"}
                    size={22}
                    color={o.points === 2 ? colors.success : o.points === 1 ? colors.brandSecondary : colors.error}
                  />
                ) : null}
              </Pressable>
            );
          })}
          {fb && (
            <View style={{ marginTop: spacing.lg }}>
              <Text testID="empathy-feedback" style={{ fontSize: 16, fontWeight: "800", color: fb.good ? colors.success : colors.onSurfaceTertiary, marginBottom: spacing.md, textAlign: "center" }}>
                {fb.text}
              </Text>
              <Button testID="empathy-next" title={i + 1 >= SITUATIONS.length ? "See Results" : "Next Situation"} onPress={next} />
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl },
  big: { fontSize: 30, fontWeight: "800", marginTop: spacing.lg, textAlign: "center" },
  qBox: { borderRadius: radius.lg, padding: spacing.xl, marginBottom: spacing.lg },
  qText: { fontSize: 18, fontWeight: "800", marginTop: spacing.md, lineHeight: 25 },
  opt: { minHeight: 60, borderRadius: radius.lg, borderWidth: 2.5, paddingHorizontal: spacing.lg, flexDirection: "row", alignItems: "center", marginBottom: spacing.md, gap: spacing.sm },
});
