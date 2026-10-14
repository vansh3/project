import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { useState } from "react";
import * as Haptics from "expo-haptics";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GameHeader } from "@/src/components/GameHeader";
import { useTheme, spacing, radius } from "@/src/theme";
import { Button } from "@/src/components/Button";
import { saveProgress } from "@/src/progress";
import { GameMedal } from "@/src/components/GameMedal";

const QUESTS = [
  { q: "A classmate is sitting alone at lunch.", options: ["Ask them to join you", "Ignore them", "Laugh at them"], good: 0 },
  { q: "Your little brother dropped his blocks.", options: ["Walk away", "Help pick them up", "Kick them"], good: 1 },
  { q: "Mom looks tired after work.", options: ["Ask for snacks", "Make noise", "Give her a hug"], good: 2 },
  { q: "A friend is crying on the playground.", options: ["Ask what's wrong", "Run away", "Tell them to stop"], good: 0 },
  { q: "You have two cookies and a friend has none.", options: ["Eat both", "Share one", "Hide them"], good: 1 },
];

export default function KindnessQuest() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [i, setI] = useState(0);
  const [stars, setStars] = useState(0);
  const [feedback, setFeedback] = useState<null | boolean>(null);
  const done = i >= QUESTS.length;

  const choose = (idx: number) => {
    if (feedback !== null) return;
    const ok = idx === QUESTS[i].good;
    setFeedback(ok);
    if (ok) setStars((s) => s + 1);
    Haptics.notificationAsync(ok ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning).catch(() => {});
  };

  const next = () => {
    const n = i + 1;
    setFeedback(null);
    setI(n);
    if (n >= QUESTS.length) saveProgress("kindness-quest", stars);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <GameHeader title="Kindness Quest" score={stars} color={colors.kidBerry} />
      {done ? (
        <View style={[styles.center, { paddingBottom: insets.bottom + spacing.xl }]}>
          <GameMedal title="Kindness Hero!" />
          <View style={{ flexDirection: "row", gap: 4, marginTop: spacing.sm }}>
            {QUESTS.map((_, k) => <Ionicons key={k} name={k < stars ? "star" : "star-outline"} size={32} color={colors.brandSecondary} />)}
          </View>
          <Text style={{ color: colors.onSurfaceTertiary, fontSize: 16, marginTop: spacing.sm }}>You earned {stars} stars</Text>
          <View style={{ width: "100%", marginTop: spacing.xl }}>
            <Button testID="kindness-replay" title="Play Again" onPress={() => { setI(0); setStars(0); }} />
          </View>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: insets.bottom + spacing.xl }}>
          <Text style={{ color: colors.muted, fontWeight: "700", marginBottom: spacing.md }}>Quest {i + 1} of {QUESTS.length}</Text>
          <View style={[styles.qBox, { backgroundColor: colors.kidPink }]}>
            <Ionicons name="heart" size={32} color={colors.onKid} />
            <Text testID="kindness-question" style={[styles.qText, { color: colors.onKid }]}>{QUESTS[i].q}</Text>
            <Text style={{ color: colors.onKid, opacity: 0.9, marginTop: spacing.sm }}>What is the kind thing to do?</Text>
          </View>
          {QUESTS[i].options.map((o, idx) => {
            const isGood = feedback !== null && idx === QUESTS[i].good;
            const optColors = [colors.kidSky, colors.kidOrange, colors.kidLime];
            return (
              <Pressable
                key={o}
                testID={`kindness-option-${idx}`}
                onPress={() => choose(idx)}
                style={[styles.opt, { backgroundColor: isGood ? colors.success : optColors[idx % 3], borderColor: isGood ? colors.kidSun : "transparent", opacity: feedback !== null && !isGood ? 0.45 : 1 }]}
              >
                <Text style={{ fontSize: 17, fontWeight: "800", color: colors.onKid }}>{o}</Text>
              </Pressable>
            );
          })}
          {feedback !== null && (
            <View style={{ marginTop: spacing.lg }}>
              <Text testID="kindness-feedback" style={{ fontSize: 18, fontWeight: "800", color: feedback ? colors.success : colors.error, marginBottom: spacing.md, textAlign: "center" }}>
                {feedback ? "That's so kind! +1 star" : "Hmm, try being kinder next time."}
              </Text>
              <Button testID="kindness-next" title="Next" onPress={next} />
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl },
  big: { fontSize: 32, fontWeight: "800", marginTop: spacing.lg },
  qBox: { borderRadius: radius.lg, padding: spacing.xl, marginBottom: spacing.xl },
  qText: { fontSize: 21, fontWeight: "800", marginTop: spacing.md, lineHeight: 28 },
  opt: { minHeight: 64, borderRadius: radius.lg, borderWidth: 3, paddingHorizontal: spacing.lg, justifyContent: "center", marginBottom: spacing.md },
});
