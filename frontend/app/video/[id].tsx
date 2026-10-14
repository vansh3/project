import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import Ionicons from "@react-native-vector-icons/ionicons";

import { useTheme, spacing, radius } from "@/src/theme";
import { apiFetch, BACKEND_URL } from "@/src/api";
import { VideoPlayer } from "@/src/components/VideoPlayer";
import { Button } from "@/src/components/Button";

export default function VideoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { data, isLoading, error } = useQuery({
    queryKey: ["video", id],
    queryFn: () => apiFetch(`/videos/${id}`),
    retry: false,
  });
  const locked = (error as any)?.status === 402;
  const url = data?.url ? (data.url.startsWith("/api/") ? `${BACKEND_URL}${data.url}` : data.url) : null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={{ paddingTop: insets.top, backgroundColor: "#000" }}>
        <View style={styles.playerBox}>
          {isLoading ? <ActivityIndicator color={colors.brandPrimary} style={{ flex: 1 }} /> : url ? <VideoPlayer url={url} /> : (
            <View style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceInverse }]}>
              <Ionicons name={locked ? "lock-closed" : "alert-circle"} size={48} color={colors.onSurfaceInverse} />
              <Text testID="video-error" style={{ color: colors.onSurfaceInverse, marginTop: 8, fontWeight: "700" }}>{locked ? "Premium content" : "Failed to load video"}</Text>
            </View>
          )}
        </View>
        <Pressable testID="video-back-button" onPress={() => router.back()} style={[styles.back, { top: insets.top + spacing.sm }]}>
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: insets.bottom + spacing.xl }}>
        {data ? (
          <>
            {data.is_premium ? (
              <View style={[styles.badge, { backgroundColor: colors.brandSecondary }]}>
                <Text style={{ color: colors.onBrandSecondary, fontSize: 11, fontWeight: "800" }}>PREMIUM</Text>
              </View>
            ) : null}
            <Text testID="video-title" style={[styles.title, { color: colors.onSurface }]}>{data.title}</Text>
            <Text style={[styles.desc, { color: colors.onSurfaceTertiary }]}>{data.description}</Text>
          </>
        ) : locked ? (
          <>
            <Text style={[styles.title, { color: colors.onSurface }]}>Unlock this guidance</Text>
            <Text style={[styles.desc, { color: colors.onSurfaceTertiary, marginBottom: spacing.xl }]}>Subscribe to Premium to watch every daily video.</Text>
            <Button testID="video-unlock-button" title="Unlock Premium" onPress={() => router.replace("/paywall")} />
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  playerBox: { width: "100%", aspectRatio: 16 / 9, backgroundColor: "#000" },
  back: { position: "absolute", left: spacing.lg, width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center" },
  badge: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, marginBottom: spacing.sm },
  title: { fontSize: 24, fontWeight: "800" },
  desc: { fontSize: 16, marginTop: spacing.md, lineHeight: 24 },
});
