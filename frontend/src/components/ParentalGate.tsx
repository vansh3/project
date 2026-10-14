import { View, Text, StyleSheet, Modal, TextInput, Pressable } from "react-native";
import { useEffect, useMemo, useState } from "react";
import Ionicons from "@react-native-vector-icons/ionicons";
import * as Haptics from "expo-haptics";

import { useTheme, spacing, radius } from "../theme";
import { Button } from "./Button";
import { useAppMode } from "../mode";

function makeChallenge() {
  const a = 10 + Math.floor(Math.random() * 15); // 10-24
  const b = 10 + Math.floor(Math.random() * 15); // 10-24
  return { a, b, answer: a + b };
}

/** Global parental gate — a quick grown-up-only math check shown before leaving
 * Kids Mode, so a child can't exit into Profile/Admin/Payments on their own. */
export function ParentalGate() {
  const { colors } = useTheme();
  const { gateVisible, resolveGate } = useAppMode();
  const [challenge, setChallenge] = useState(makeChallenge);
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    if (gateVisible) {
      setChallenge(makeChallenge());
      setValue("");
      setError(false);
    }
  }, [gateVisible]);

  const submit = () => {
    const ok = parseInt(value, 10) === challenge.answer;
    if (ok) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      resolveGate(true);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      setError(true);
      setChallenge(makeChallenge());
      setValue("");
    }
  };

  return (
    <Modal visible={gateVisible} transparent animationType="fade" onRequestClose={() => resolveGate(false)}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: colors.surface }]} testID="parental-gate">
          <View style={[styles.iconWrap, { backgroundColor: colors.brandTertiary }]}>
            <Ionicons name="shield-checkmark" size={28} color={colors.onBrandTertiary} />
          </View>
          <Text style={[styles.title, { color: colors.onSurface }]}>Grown-ups only</Text>
          <Text style={[styles.sub, { color: colors.onSurfaceTertiary }]}>Solve this to leave Kids Mode</Text>
          <Text testID="parental-gate-question" style={[styles.question, { color: colors.onSurface }]}>
            {challenge.a} + {challenge.b} = ?
          </Text>
          <TextInput
            testID="parental-gate-input"
            value={value}
            onChangeText={(t) => { setValue(t.replace(/[^0-9]/g, "")); setError(false); }}
            keyboardType="number-pad"
            placeholder="Your answer"
            placeholderTextColor={colors.muted}
            style={[styles.input, { borderColor: error ? colors.error : colors.border, color: colors.onSurface, backgroundColor: colors.surfaceSecondary }]}
            autoFocus
          />
          {error ? <Text style={{ color: colors.error, fontSize: 13, marginTop: spacing.xs }}>Not quite — try the new sum below.</Text> : null}
          <View style={{ flexDirection: "row", gap: spacing.md, marginTop: spacing.xl, width: "100%" }}>
            <View style={{ flex: 1 }}>
              <Button testID="parental-gate-cancel" title="Stay in Kids Mode" variant="secondary" onPress={() => resolveGate(false)} />
            </View>
            <View style={{ flex: 1 }}>
              <Button testID="parental-gate-submit" title="Confirm" onPress={submit} disabled={!value} />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center", padding: spacing.xl },
  card: { width: "100%", maxWidth: 360, borderRadius: radius.lg, padding: spacing.xl, alignItems: "center" },
  iconWrap: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 19, fontWeight: "800", marginTop: spacing.md },
  sub: { fontSize: 13, marginTop: spacing.xs, textAlign: "center" },
  question: { fontSize: 28, fontWeight: "900", marginTop: spacing.lg },
  input: { width: "100%", height: 50, borderRadius: radius.md, borderWidth: 2, paddingHorizontal: spacing.lg, marginTop: spacing.lg, fontSize: 16, textAlign: "center" },
});
