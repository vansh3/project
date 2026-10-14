import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useTheme, spacing, radius } from "../theme";

export function GameHeader({ title, score, color }: { title: string; score?: number; color?: string }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const bg = color || colors.surface;
  const fg = color ? colors.onKid : colors.onSurface;
  return (
    <View style={[styles.row, { paddingTop: insets.top + spacing.sm, backgroundColor: bg }]}>
      <Pressable testID="game-back-button" onPress={() => router.back()} style={[styles.back, { backgroundColor: color ? "rgba(255,255,255,0.3)" : colors.surfaceTertiary }]}>
        <Ionicons name="chevron-back" size={26} color={fg} />
      </Pressable>
      <Text style={[styles.title, { color: fg }]} numberOfLines={1}>{title}</Text>
      {score !== undefined ? (
        <View testID="game-score" style={[styles.score, { backgroundColor: colors.kidSun }]}>
          <Ionicons name="star" size={16} color={colors.onKidLight} />
          <Text style={{ color: colors.onKidLight, fontWeight: "800", marginLeft: 4 }}>{score}</Text>
        </View>
      ) : <View style={{ width: 56 }} />}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.lg, paddingBottom: spacing.md, gap: spacing.md },
  back: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  title: { flex: 1, fontSize: 22, fontWeight: "800" },
  score: { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.md, height: 36, borderRadius: radius.pill },
});
