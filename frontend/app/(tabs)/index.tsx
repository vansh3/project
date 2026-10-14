import { View, Text, StyleSheet, ScrollView, Pressable, Image, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import Ionicons from "@react-native-vector-icons/ionicons";
import { LinearGradient } from "expo-linear-gradient";

import { useAuth } from "@/src/auth";
import { useTheme, spacing, radius } from "@/src/theme";
import { apiFetch } from "@/src/api";

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const { data, refetch, isRefetching } = useQuery({
    queryKey: ["videos-home"],
    queryFn: () => apiFetch("/videos"),
  });

  const videos = data?.videos || [];
  const featured = videos[0];
  const rest = videos.slice(1);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.surface }}
      contentContainerStyle={{ paddingTop: insets.top + spacing.md, paddingBottom: spacing.xl }}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.brandPrimary} />}
      testID="home-screen"
    >
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: spacing.xl }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.greeting, { color: colors.onSurfaceTertiary }]}>Welcome back</Text>
          <Text style={[styles.name, { color: colors.onSurface }]}>{user?.name || "Parent"}</Text>
        </View>
        {user?.role === "admin" ? (
          <Pressable testID="home-admin-button" onPress={() => router.push("/admin")} style={[styles.adminChip, { backgroundColor: colors.brandTertiary }]}>
            <Ionicons name="shield-checkmark" size={16} color={colors.onBrandTertiary} />
            <Text style={{ color: colors.onBrandTertiary, fontWeight: "700", marginLeft: 6 }}>Admin</Text>
          </Pressable>
        ) : !user?.premium ? (
          <Pressable testID="home-premium-cta" onPress={() => router.push("/paywall")} style={[styles.premiumChip, { backgroundColor: colors.brandSecondary }]}>
            <Ionicons name="star" size={14} color={colors.onBrandSecondary} />
            <Text style={{ color: colors.onBrandSecondary, fontWeight: "700", marginLeft: 6 }}>Go Premium</Text>
          </Pressable>
        ) : null}
      </View>

      {/* Featured card */}
      {featured && (
        <Pressable
          testID="home-featured-video"
          onPress={() => router.push(`/video/${featured.video_id}`)}
          style={[styles.featured, { marginHorizontal: spacing.xl }]}
        >
          <Image source={{ uri: featured.thumbnail_url }} style={styles.featuredImg} />
          <LinearGradient
            colors={["transparent", "rgba(38,70,83,0.85)"]}
            style={styles.scrim}
          />
          <View style={styles.featuredTextBox}>
            <Text style={styles.featuredTag}>Today&apos;s Guidance</Text>
            <Text style={styles.featuredTitle} numberOfLines={2}>{featured.title}</Text>
          </View>
          <View style={[styles.playBtn, { backgroundColor: colors.surface }]}>
            <Ionicons name="play" size={24} color={colors.brandPrimary} />
          </View>
        </Pressable>
      )}

      {/* Meet the coach */}
      <Pressable
        testID="home-about-coach-banner"
        onPress={() => router.push("/about")}
        style={[styles.coachBanner, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border, marginHorizontal: spacing.xl }]}
      >
        <View style={[styles.coachAvatar, { backgroundColor: colors.surfaceTertiary }]}>
          <Ionicons name="person" size={26} color={colors.muted} />
        </View>
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <Text style={[styles.coachName, { color: colors.onSurface }]}>Guided by Richa Madan</Text>
          <Text style={[styles.coachRole, { color: colors.onSurfaceTertiary }]}>Certified Kids&apos; Emotion Coach</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.muted} />
      </Pressable>

      {/* Quick actions */}
      <View style={[styles.quickRow, { paddingHorizontal: spacing.xl }]}>
        <Pressable testID="home-games-shortcut" onPress={() => router.push("/(tabs)/games")} style={[styles.quickCard, { backgroundColor: colors.brandPrimary }]}>
          <Ionicons name="game-controller" size={32} color={colors.onBrandPrimary} />
          <Text style={[styles.quickTitle, { color: colors.onBrandPrimary }]}>Kids Games</Text>
          <Text style={[styles.quickSub, { color: colors.onBrandPrimary }]}>9 fun activities</Text>
        </Pressable>
        <Pressable testID="home-videos-shortcut" onPress={() => router.push("/(tabs)/videos")} style={[styles.quickCard, { backgroundColor: colors.brandTertiary }]}>
          <Ionicons name="videocam" size={32} color={colors.onBrandTertiary} />
          <Text style={[styles.quickTitle, { color: colors.onBrandTertiary }]}>Videos</Text>
          <Text style={[styles.quickSub, { color: colors.onBrandTertiary }]}>Daily guidance</Text>
        </Pressable>
      </View>

      {/* Recent */}
      <Text style={[styles.sectionTitle, { color: colors.onSurface, paddingHorizontal: spacing.xl }]}>Recent videos</Text>
      <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
        {rest.map((v: any) => (
          <Pressable
            key={v.video_id}
            testID={`home-video-${v.video_id}`}
            onPress={() => v.locked ? router.push("/paywall") : router.push(`/video/${v.video_id}`)}
            style={[styles.videoRow, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
          >
            <Image source={{ uri: v.thumbnail_url }} style={styles.rowThumb} />
            <View style={{ flex: 1, padding: spacing.md }}>
              <Text style={[styles.rowTitle, { color: colors.onSurface }]} numberOfLines={2}>{v.title}</Text>
              <Text style={[styles.rowDesc, { color: colors.onSurfaceTertiary }]} numberOfLines={2}>{v.description}</Text>
              {v.locked ? (
                <View style={[styles.lockBadge, { backgroundColor: colors.brandSecondary }]}>
                  <Ionicons name="lock-closed" size={10} color={colors.onBrandSecondary} />
                  <Text style={{ color: colors.onBrandSecondary, fontSize: 10, fontWeight: "700", marginLeft: 4 }}>PREMIUM</Text>
                </View>
              ) : null}
            </View>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", marginBottom: spacing.lg },
  greeting: { fontSize: 13 },
  name: { fontSize: 24, fontWeight: "800", marginTop: 2 },
  adminChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.pill, flexDirection: "row", alignItems: "center" },
  premiumChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.pill, flexDirection: "row", alignItems: "center" },
  featured: { height: 220, borderRadius: radius.lg, overflow: "hidden", marginBottom: spacing.xl },
  featuredImg: { ...StyleSheet.absoluteFill, width: "100%", height: "100%" },
  scrim: { ...StyleSheet.absoluteFill },
  featuredTextBox: { position: "absolute", left: spacing.lg, right: 80, bottom: spacing.lg },
  featuredTag: { color: "#FFFFFF", fontSize: 12, fontWeight: "700", opacity: 0.9, letterSpacing: 1, textTransform: "uppercase" },
  featuredTitle: { color: "#FFFFFF", fontSize: 22, fontWeight: "800", marginTop: 4 },
  playBtn: { position: "absolute", right: spacing.lg, bottom: spacing.lg, width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  coachBanner: { flexDirection: "row", alignItems: "center", borderRadius: radius.lg, borderWidth: 1, padding: spacing.md, marginBottom: spacing.xl },
  coachAvatar: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  coachName: { fontSize: 15, fontWeight: "800" },
  coachRole: { fontSize: 12, marginTop: 2 },
  quickRow: { flexDirection: "row", gap: spacing.md, marginBottom: spacing.xl },
  quickCard: { flex: 1, borderRadius: radius.lg, padding: spacing.lg, minHeight: 120, justifyContent: "space-between" },
  quickTitle: { fontSize: 18, fontWeight: "800", marginTop: spacing.sm },
  quickSub: { fontSize: 12, opacity: 0.85 },
  sectionTitle: { fontSize: 18, fontWeight: "800", marginBottom: spacing.md },
  videoRow: { borderRadius: radius.md, borderWidth: 1, overflow: "hidden", flexDirection: "row" },
  rowThumb: { width: 100, height: 100 },
  rowTitle: { fontSize: 15, fontWeight: "700" },
  rowDesc: { fontSize: 13, marginTop: 4 },
  lockBadge: { alignSelf: "flex-start", marginTop: spacing.sm, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill, flexDirection: "row", alignItems: "center" },
});
