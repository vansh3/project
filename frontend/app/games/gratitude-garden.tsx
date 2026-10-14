import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { useState } from "react";
import * as Haptics from "expo-haptics";
import Ionicons from "@react-native-vector-icons/ionicons";
import Animated, { FadeIn, ZoomIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GameHeader } from "@/src/components/GameHeader";
import { GameMedal } from "@/src/components/GameMedal";
import { useTheme, spacing, radius, ThemeColors } from "@/src/theme";
import { Button } from "@/src/components/Button";
import { saveProgress } from "@/src/progress";

type K = keyof ThemeColors;
// A calm, reflective game — there are no wrong answers here.
const ITEMS: { label: string; icon: string; color: K }[] = [
  { label: "My Family", icon: "heart", color: "kidCoral" },
  { label: "My Friends", icon: "people", color: "kidSky" },
  { label: "My Pet", icon: "paw", color: "kidOrange" },
  { label: "Sunshine", icon: "sunny", color: "kidSun" },
  { label: "My Books", icon: "book", color: "kidBerry" },
  { label: "Yummy Food", icon: "restaurant", color: "kidLime" },
  { label: "My Home", icon: "home", color: "kidPink" },
  { label: "My Toys", icon: "game-controller", color: "kidMint" },
  { label: "My Teacher", icon: "school", color: "kidSky" },
  { label: "The Outdoors", icon: "leaf", color: "kidLime" },
];
const GOAL = 5;

export default function GratitudeGarden() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [picked, setPicked] = useState<string[]>([]);
  const [grown, setGrown] = useState(false);

  const toggle = (label: string) => {
    Haptics.selectionAsync().catch(() => {});
    setPicked((prev) => {
      if (prev.includes(label)) return prev.filter((p) => p !== label);
      if (prev.length >= GOAL) return prev;
      return [...prev, label];
    });
  };

  const grow = () => {
    setGrown(true);
    saveProgress("gratitude-garden", picked.length);
  };

  const replay = () => {
    setGrown(false);
    setPicked([]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <GameHeader title="Gratitude Garden" score={picked.length} color={colors.kidLime} />
      {grown ? (
        <View style={[styles.center, { paddingBottom: insets.bottom + spacing.xl }]}>
          <GameMedal title="Gratitude Grower!" />
          <View style={styles.gardenGrid} testID="garden-result">
            {ITEMS.filter((it) => picked.includes(it.label)).map((it, idx) => (
              <Animated.View key={it.label} entering={ZoomIn.delay(idx * 120)} style={[styles.gardenCell, { backgroundColor: colors[it.color] }]}>
                <Ionicons name={it.icon as any} size={28} color={colors.onKid} />
                <Text style={{ fontSize: 12, fontWeight: "800", color: colors.onKid, marginTop: 4, textAlign: "center" }}>{it.label}</Text>
              </Animated.View>
            ))}
          </View>
          <Text style={{ color: colors.onSurfaceTertiary, fontSize: 15, marginTop: spacing.lg, textAlign: "center" }}>
            You grew a garden of {GOAL} things you're grateful for!
          </Text>
          <View style={{ width: "100%", marginTop: spacing.xl }}>
            <Button testID="garden-replay" title="Plant Again" onPress={replay} />
          </View>
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: spacing.xl }}>
            <Text style={{ color: colors.muted, fontWeight: "700", marginBottom: spacing.md, textAlign: "center" }}>
              Pick {GOAL} things you're grateful for ({picked.length}/{GOAL})
            </Text>
            <View style={styles.grid}>
              {ITEMS.map((it, idx) => {
                const selected = picked.includes(it.label);
                return (
                  <Animated.View key={it.label} entering={FadeIn.delay(idx * 50)} style={styles.cell}>
                    <Pressable
                      testID={`garden-item-${it.label.replace(/\s+/g, "-").toLowerCase()}`}
                      onPress={() => toggle(it.label)}
                      style={[
                        styles.item,
                        {
                          backgroundColor: selected ? colors[it.color] : colors.surfaceSecondary,
                          borderColor: selected ? colors.kidSun : colors.border,
                        },
                      ]}
                    >
                      {selected && (
                        <View style={[styles.check, { backgroundColor: colors.kidSun }]}>
                          <Ionicons name="checkmark" size={14} color={colors.onKidLight} />
                        </View>
                      )}
                      <Ionicons name={it.icon as any} size={30} color={selected ? colors.onKid : colors.onSurface} />
                      <Text style={{ fontSize: 13, fontWeight: "700", color: selected ? colors.onKid : colors.onSurface, marginTop: 6, textAlign: "center" }}>{it.label}</Text>
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>
          </ScrollView>
          <View style={{ padding: spacing.xl, paddingBottom: insets.bottom + spacing.lg }}>
            <Button testID="garden-grow-button" title="Grow My Garden" disabled={picked.length < GOAL} onPress={grow} />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: spacing.md },
  cell: { width: "31%" },
  item: { minHeight: 100, borderRadius: radius.lg, borderWidth: 3, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.xs, paddingVertical: spacing.sm },
  check: { position: "absolute", top: 6, right: 6, width: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  gardenGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: spacing.md, marginTop: spacing.md },
  gardenCell: { width: 84, height: 84, borderRadius: radius.lg, alignItems: "center", justifyContent: "center" },
});
