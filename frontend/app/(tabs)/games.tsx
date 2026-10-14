import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import Ionicons from "@react-native-vector-icons/ionicons";

import { useTheme, spacing, radius, ThemeColors } from "@/src/theme";
import { useAuth } from "@/src/auth";

type K = keyof ThemeColors;
const GAMES: { id: string; title: string; desc: string; icon: string; from: K; to: K; isNew?: boolean; isPremium?: boolean }[] = [
  { id: "color-mood", title: "Color My Mood", desc: "Paint feelings with colors", icon: "color-palette", from: "kidPink", to: "kidOrange" },
  { id: "feeling-bubbles", title: "Feeling Bubbles", desc: "Pop the right colors!", icon: "ellipse", from: "kidSky", to: "kidMint" },
  { id: "mood-match", title: "Mood Match", desc: "Match faces to feelings", icon: "happy", from: "kidCoral", to: "kidPink" },
  { id: "calm-breathing", title: "Calm Breathing", desc: "Breathe with the balloon", icon: "leaf", from: "kidMint", to: "kidLime" },
  { id: "memory-cards", title: "Memory Cards", desc: "Flip and match emotions", icon: "copy", from: "kidOrange", to: "kidSun" },
  { id: "kindness-quest", title: "Kindness Quest", desc: "Be kind, earn stars", icon: "heart", from: "kidBerry", to: "kidCoral" },
  { id: "story-builder", title: "Story Builder", desc: "Build feeling stories", icon: "book", from: "kidSky", to: "kidBerry" },
  { id: "scenario-sense", title: "Scenario Sense", desc: "Advanced: name tricky feelings", icon: "bulb", from: "kidBerry", to: "kidPink", isNew: true, isPremium: true },
  { id: "empathy-challenge", title: "Empathy Challenge", desc: "Advanced: pick the kindest choice", icon: "people-circle", from: "kidLime", to: "kidSky", isNew: true, isPremium: true },
];

const RAINBOW: K[] = ["kidCoral", "kidOrange", "kidSun", "kidLime", "kidSky", "kidPink"];

export default function Games() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { user } = useAuth();
  const canPlayPremium = !!user?.premium || user?.role === "admin";

  const openGame = (g: (typeof GAMES)[number]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    if (g.isPremium && !canPlayPremium) {
      router.push("/paywall");
      return;
    }
    router.push(`/games/${g.id}` as any);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={{ paddingTop: insets.top + spacing.md, paddingHorizontal: spacing.xl, paddingBottom: spacing.md }}>
        <View style={styles.rainbow}>
          {RAINBOW.map((c) => <View key={c} style={[styles.rainbowBar, { backgroundColor: colors[c] }]} />)}
        </View>
        <Text style={[styles.title, { color: colors.onSurface }]}>Kids Zone</Text>
        <Text style={[styles.subtitle, { color: colors.onSurfaceTertiary }]}>Pick a colorful game to play!</Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.xl }} testID="games-screen">
        <View style={styles.grid}>
          {GAMES.map((g, idx) => {
            const locked = !!g.isPremium && !canPlayPremium;
            return (
              <Animated.View key={g.id} entering={FadeInDown.delay(idx * 60).springify()} style={styles.cell}>
                <Pressable
                  testID={`game-card-${g.id}`}
                  onPress={() => openGame(g)}
                  style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.95 : 1 }] }]}
                >
                  <LinearGradient colors={[colors[g.from], colors[g.to]]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
                    <View style={[styles.blob, { backgroundColor: "rgba(255,255,255,0.18)" }]} />
                    <View style={[styles.blobSmall, { backgroundColor: "rgba(255,255,255,0.22)" }]} />
                    {locked ? (
                      <View testID={`game-locked-${g.id}`} style={[styles.newBadge, { backgroundColor: colors.onSurface, flexDirection: "row", alignItems: "center", gap: 4 }]}>
                        <Ionicons name="lock-closed" size={11} color={colors.surface} />
                        <Text style={{ color: colors.surface, fontSize: 10, fontWeight: "900" }}>PREMIUM</Text>
                      </View>
                    ) : g.isNew ? (
                      <View style={[styles.newBadge, { backgroundColor: colors.kidSun }]}>
                        <Text style={{ color: colors.onKidLight, fontSize: 10, fontWeight: "900" }}>NEW</Text>
                      </View>
                    ) : null}
                    <View style={[styles.iconBubble, locked && { opacity: 0.6 }]}>
                      <Ionicons name={(locked ? "lock-closed" : g.icon) as any} size={locked ? 32 : 40} color={colors.onKid} />
                    </View>
                    <View>
                      <Text style={[styles.cardTitle, { color: colors.onKid }]}>{g.title}</Text>
                      <Text style={[styles.cardDesc, { color: colors.onKid }]}>{g.desc}</Text>
                    </View>
                  </LinearGradient>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  rainbow: { flexDirection: "row", gap: 4, marginBottom: spacing.md },
  rainbowBar: { width: 28, height: 8, borderRadius: 4 },
  title: { fontSize: 30, fontWeight: "900" },
  subtitle: { fontSize: 15, marginTop: 4 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: spacing.md },
  cell: { width: "48%" },
  card: { borderRadius: radius.lg, padding: spacing.lg, minHeight: 180, justifyContent: "space-between", overflow: "hidden" },
  blob: { position: "absolute", width: 140, height: 140, borderRadius: 70, right: -40, top: -40 },
  blobSmall: { position: "absolute", width: 60, height: 60, borderRadius: 30, left: -15, bottom: -15 },
  newBadge: { position: "absolute", top: spacing.md, right: spacing.md, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill },
  iconBubble: { width: 68, height: 68, borderRadius: 34, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.28)" },
  cardTitle: { fontSize: 19, fontWeight: "900", marginTop: spacing.md },
  cardDesc: { fontSize: 13, marginTop: 2, opacity: 0.95 },
});
