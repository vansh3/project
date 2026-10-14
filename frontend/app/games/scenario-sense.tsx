import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import Ionicons from "@react-native-vector-icons/ionicons";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GameHeader } from "@/src/components/GameHeader";
import { useTheme, spacing, radius, ThemeColors } from "@/src/theme";
import { Button } from "@/src/components/Button";
import { saveProgress } from "@/src/progress";
import { useAuth } from "@/src/auth";

type K = keyof ThemeColors;

// Advanced emotional-vocabulary game: real-life scenarios with nuanced, close
// feeling options (not just happy/sad) so kids learn to tell similar feelings apart.
const SCENARIOS: { text: string; options: { label: string; icon: string; color: K }[]; good: number }[] = [
  {
    text: "You built a tall block tower all afternoon, and it just fell down.",
    options: [
      { label: "Frustrated", icon: "flash", color: "kidOrange" },
      { label: "Bored", icon: "time", color: "kidSky" },
      { label: "Proud", icon: "trophy", color: "kidSun" },
      { label: "Sleepy", icon: "moon", color: "kidMint" },
    ],
    good: 0,
  },
  {
    text: "Your best friend got picked for the team first, and you got picked last.",
    options: [
      { label: "Excited", icon: "flame", color: "kidCoral" },
      { label: "Left out", icon: "people", color: "kidBerry" },
      { label: "Calm", icon: "leaf", color: "kidLime" },
      { label: "Curious", icon: "search", color: "kidSky" },
    ],
    good: 1,
  },
  {
    text: "You studied hard for a spelling test and got every word right.",
    options: [
      { label: "Nervous", icon: "alert-circle", color: "kidOrange" },
      { label: "Confused", icon: "help-circle", color: "kidSky" },
      { label: "Accomplished", icon: "ribbon", color: "kidSun" },
      { label: "Angry", icon: "thunderstorm", color: "kidCoral" },
    ],
    good: 2,
  },
  {
    text: "You're about to go down a big slide for the very first time.",
    options: [
      { label: "Nervous but excited", icon: "rocket", color: "kidPink" },
      { label: "Sad", icon: "rainy", color: "kidSky" },
      { label: "Tired", icon: "bed", color: "kidMint" },
      { label: "Jealous", icon: "eye", color: "kidBerry" },
    ],
    good: 0,
  },
  {
    text: "Someone took your favorite crayon without asking, and now it's broken.",
    options: [
      { label: "Annoyed", icon: "warning", color: "kidOrange" },
      { label: "Happy", icon: "happy", color: "kidSun" },
      { label: "Relaxed", icon: "leaf", color: "kidLime" },
      { label: "Hungry", icon: "restaurant", color: "kidCoral" },
    ],
    good: 0,
  },
  {
    text: "You moved to a new class and don't know anyone yet.",
    options: [
      { label: "Nervous", icon: "alert-circle", color: "kidOrange" },
      { label: "Confident", icon: "star", color: "kidSun" },
      { label: "Furious", icon: "flame", color: "kidCoral" },
      { label: "Sleepy", icon: "moon", color: "kidMint" },
    ],
    good: 0,
  },
  {
    text: "Your little sister drew on your homework by accident, and she's about to cry.",
    options: [
      { label: "Irritated but caring", icon: "heart-half", color: "kidPink" },
      { label: "Thrilled", icon: "sparkles", color: "kidSun" },
      { label: "Bored", icon: "time", color: "kidSky" },
      { label: "Jealous", icon: "eye", color: "kidBerry" },
    ],
    good: 0,
  },
  {
    text: "You finally learned to tie your shoes all by yourself!",
    options: [
      { label: "Disappointed", icon: "sad", color: "kidCoral" },
      { label: "Confident", icon: "star", color: "kidSun" },
      { label: "Worried", icon: "alert-circle", color: "kidOrange" },
      { label: "Embarrassed", icon: "eye-off", color: "kidBerry" },
    ],
    good: 1,
  },
];

export default function ScenarioSense() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const locked = !user?.premium && user?.role !== "admin";
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<null | boolean>(null);
  const [pickedIdx, setPickedIdx] = useState<number | null>(null);
  const savedRef = useRef(false);
  const done = i >= SCENARIOS.length;

  useEffect(() => {
    if (locked) router.replace("/paywall");
  }, [locked, router]);

  if (locked) return null;

  const choose = (idx: number) => {
    if (feedback !== null) return;
    const ok = idx === SCENARIOS[i].good;
    setPickedIdx(idx);
    setFeedback(ok);
    if (ok) setScore((s) => s + 1);
    Haptics.notificationAsync(ok ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning).catch(() => {});
  };

  const next = () => {
    const n = i + 1;
    setFeedback(null);
    setPickedIdx(null);
    setI(n);
    if (n >= SCENARIOS.length && !savedRef.current) {
      savedRef.current = true;
      saveProgress("scenario-sense", score);
    }
  };

  const replay = () => {
    savedRef.current = false;
    setI(0);
    setScore(0);
    setFeedback(null);
    setPickedIdx(null);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <GameHeader title="Scenario Sense" score={score} color={colors.kidBerry} />
      {done ? (
        <View style={[styles.center, { paddingBottom: insets.bottom + spacing.xl }]}>
          <Ionicons name="bulb" size={72} color={colors.kidSun} />
          <Text testID="scenario-result" style={[styles.big, { color: colors.onSurface }]}>Feelings Expert!</Text>
          <Text style={{ color: colors.onSurfaceTertiary, fontSize: 16 }}>You identified {score} of {SCENARIOS.length} feelings correctly</Text>
          <View style={{ width: "100%", marginTop: spacing.xl }}>
            <Button testID="scenario-replay" title="Play Again" onPress={replay} />
          </View>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: insets.bottom + spacing.xl }}>
          <Text style={{ color: colors.muted, fontWeight: "700", marginBottom: spacing.md }}>Scenario {i + 1} of {SCENARIOS.length}</Text>
          <Animated.View key={`q-${i}`} entering={FadeIn} style={[styles.qBox, { backgroundColor: colors.kidBerry }]}>
            <Ionicons name="book" size={30} color={colors.onKid} />
            <Text testID="scenario-text" style={[styles.qText, { color: colors.onKid }]}>{SCENARIOS[i].text}</Text>
            <Text style={{ color: colors.onKid, opacity: 0.9, marginTop: spacing.sm }}>What's the BEST way to describe this feeling?</Text>
          </Animated.View>
          <View style={styles.grid}>
            {SCENARIOS[i].options.map((o, idx) => {
              const isGood = feedback !== null && idx === SCENARIOS[i].good;
              const isPickedWrong = feedback === false && idx === pickedIdx;
              return (
                <Animated.View key={o.label} entering={FadeIn.delay(idx * 60)} style={styles.cell}>
                  <Pressable
                    testID={`scenario-option-${idx}`}
                    onPress={() => choose(idx)}
                    style={[
                      styles.opt,
                      {
                        backgroundColor: colors[o.color],
                        borderColor: isGood ? colors.kidSun : isPickedWrong ? colors.error : "transparent",
                        opacity: feedback !== null && !isGood && idx !== pickedIdx ? 0.4 : 1,
                      },
                    ]}
                  >
                    <Ionicons name={o.icon as any} size={26} color={colors.onKid} />
                    <Text style={{ fontSize: 14, fontWeight: "800", color: colors.onKid, marginTop: 6, textAlign: "center" }}>{o.label}</Text>
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>
          {feedback !== null && (
            <View style={{ marginTop: spacing.lg }}>
              <Text testID="scenario-feedback" style={{ fontSize: 17, fontWeight: "800", color: feedback ? colors.success : colors.error, marginBottom: spacing.md, textAlign: "center" }}>
                {feedback ? "Great reading! +1 point" : `Close — "${SCENARIOS[i].options[SCENARIOS[i].good].label}" fits best here.`}
              </Text>
              <Button testID="scenario-next" title={i + 1 >= SCENARIOS.length ? "See Results" : "Next Scenario"} onPress={next} />
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
  qText: { fontSize: 19, fontWeight: "800", marginTop: spacing.md, lineHeight: 26 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: spacing.md },
  cell: { width: "48%" },
  opt: { minHeight: 100, borderRadius: radius.lg, borderWidth: 3, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.sm },
});
