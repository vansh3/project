import { View, Text, StyleSheet, ScrollView, Pressable, Image, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import Ionicons from "@react-native-vector-icons/ionicons";

import { useTheme, spacing, radius } from "@/src/theme";
import { apiFetch } from "@/src/api";

export default function Videos() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { data, refetch, isRefetching } = useQuery({
    queryKey: ["videos-list"],
    queryFn: () => apiFetch("/videos"),
  });
  const videos = data?.videos || [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md, borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
        <Text style={[styles.title, { color: colors.onSurface }]}>Guidance Library</Text>
        <Text style={[styles.subtitle, { color: colors.onSurfaceTertiary }]}>Daily emotional coaching for parents</Text>
      </View>
      <ScrollView
        contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg, paddingBottom: spacing.xl }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.brandPrimary} />}
        testID="videos-screen"
      >
        {videos.map((v: any) => (
          <Pressable
            key={v.video_id}
            testID={`video-card-${v.video_id}`}
            onPress={() => v.locked ? router.push("/paywall") : router.push(`/video/${v.video_id}`)}
            style={[styles.card, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
          >
            <View style={styles.thumbBox}>
              <Image source={{ uri: v.thumbnail_url }} style={styles.thumb} />
              <View style={[styles.playOverlay, { backgroundColor: v.locked ? colors.surfaceInverse : "rgba(0,0,0,0.4)" }]}>
                <View style={[styles.playCircle, { backgroundColor: colors.surface }]}>
                  <Ionicons name={v.locked ? "lock-closed" : "play"} size={22} color={colors.brandPrimary} />
                </View>
              </View>
              {v.is_premium ? (
                <View style={[styles.premiumBadge, { backgroundColor: colors.brandSecondary }]}>
                  <Ionicons name="star" size={10} color={colors.onBrandSecondary} />
                  <Text style={{ color: colors.onBrandSecondary, fontSize: 10, fontWeight: "800", marginLeft: 4 }}>PREMIUM</Text>
                </View>
              ) : null}
            </View>
            <View style={{ padding: spacing.lg }}>
              <Text style={[styles.cardTitle, { color: colors.onSurface }]}>{v.title}</Text>
              <Text style={[styles.cardDesc, { color: colors.onSurfaceTertiary }]} numberOfLines={2}>{v.description}</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.xl, paddingBottom: spacing.lg, borderBottomWidth: 1 },
  title: { fontSize: 26, fontWeight: "800" },
  subtitle: { fontSize: 14, marginTop: 4 },
  card: { borderRadius: radius.lg, overflow: "hidden", borderWidth: 1 },
  thumbBox: { position: "relative", height: 180 },
  thumb: { width: "100%", height: "100%" },
  playOverlay: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center" },
  playCircle: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  premiumBadge: { position: "absolute", top: spacing.md, right: spacing.md, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.pill, flexDirection: "row", alignItems: "center" },
  cardTitle: { fontSize: 17, fontWeight: "800" },
  cardDesc: { fontSize: 14, marginTop: 6 },
});
