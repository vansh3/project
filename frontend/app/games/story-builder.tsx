import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { useState } from "react";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GameHeader } from "@/src/components/GameHeader";
import { useTheme, spacing, radius } from "@/src/theme";
import { Button } from "@/src/components/Button";
import { saveProgress } from "@/src/progress";

const STEPS = [
  { label: "Who is in the story?", options: ["a little bunny", "a brave girl", "a sleepy bear", "a tiny robot"] },
  { label: "How do they feel?", options: ["worried", "excited", "grumpy", "lonely"] },
  { label: "What happened?", options: ["lost a favorite toy", "started a new school", "had a fight with a friend", "saw a big storm"] },
  { label: "What helped them?", options: ["taking deep breaths", "talking to a grown-up", "a warm hug", "drawing a picture"] },
];

export default function StoryBuilder() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [picks, setPicks] = useState<string[]>([]);
  const step = picks.length;
  const done = step >= STEPS.length;

  const pick = (o: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const np = [...picks, o];
    setPicks(np);
    if (np.length >= STEPS.length) saveProgress("story-builder", 1);
  };

  const story = done
    ? `Once upon a time, there was ${picks[0]} who felt ${picks[1]} because they ${picks[2]}. Then, ${picks[3]} made them feel so much better. The end!`
    : "";

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <GameHeader title="Story Builder" score={step} color={colors.kidMint} />
      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: insets.bottom + spacing.xl }}>
        {done ? (
          <>
            <View style={[styles.storyBox, { backgroundColor: colors.kidSun }]}>
              <Text style={[styles.storyLabel, { color: colors.onKidLight }]}>Your Story</Text>
              <Text testID="story-result" style={[styles.storyText, { color: colors.onKidLight }]}>{story}</Text>
            </View>
            <Text style={{ color: colors.onSurfaceTertiary, fontSize: 15, marginVertical: spacing.lg, lineHeight: 22 }}>
              Talk about it: Have you ever felt {picks[1]}? What helps you feel better?
            </Text>
            <Button testID="story-new" title="Build Another Story" onPress={() => setPicks([])} />
          </>
        ) : (
          <>
            <View style={styles.dots}>
              {STEPS.map((_, k) => (
                <View key={k} style={[styles.dot, { backgroundColor: k <= step ? [colors.kidCoral, colors.kidSun, colors.kidLime, colors.kidSky][k] : colors.surfaceTertiary }]} />
              ))}
            </View>
            <Text testID="story-step-label" style={[styles.q, { color: colors.onSurface }]}>{STEPS[step].label}</Text>
            {STEPS[step].options.map((o, idx) => {
              const optColors = [colors.kidCoral, colors.kidSky, colors.kidOrange, colors.kidBerry];
              return (
                <Pressable
                  key={o}
                  testID={`story-option-${idx}`}
                  onPress={() => pick(o)}
                  style={({ pressed }) => [styles.opt, { backgroundColor: optColors[idx % 4], transform: [{ scale: pressed ? 0.96 : 1 }] }]}
                >
                  <Text style={{ fontSize: 18, fontWeight: "800", color: colors.onKid }}>{o}</Text>
                </Pressable>
              );
            })}
            {picks.length > 0 && (
              <Text style={{ color: colors.muted, marginTop: spacing.lg, fontStyle: "italic" }}>So far: {picks.join(" · ")}</Text>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  dots: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.xl },
  dot: { flex: 1, height: 8, borderRadius: 4 },
  q: { fontSize: 26, fontWeight: "800", marginBottom: spacing.xl },
  opt: { minHeight: 64, borderRadius: radius.lg, paddingHorizontal: spacing.lg, justifyContent: "center", marginBottom: spacing.md },
  storyBox: { borderRadius: radius.lg, padding: spacing.xl },
  storyLabel: { fontSize: 13, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1 },
  storyText: { fontSize: 22, fontWeight: "700", lineHeight: 32, marginTop: spacing.md },
});
