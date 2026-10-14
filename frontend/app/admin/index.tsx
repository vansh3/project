import { View, Text, StyleSheet, FlatList, Pressable, Image, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useState } from "react";

import { useTheme, spacing, radius } from "@/src/theme";
import { apiFetch } from "@/src/api";
import { useAuth } from "@/src/auth";

export default function Admin() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const { data, isLoading, refetch, isRefetching } = useQuery({ queryKey: ["admin-videos"], queryFn: () => apiFetch("/videos") });
  const videos = data?.videos || [];

  const remove = async (id: string) => {
    await apiFetch(`/videos/${id}`, { method: "DELETE" });
    setConfirmId(null);
    qc.invalidateQueries();
  };

  if (user?.role !== "admin") {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface }}>
        <Text testID="admin-forbidden" style={{ color: colors.onSurface }}>Admins only</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm, borderBottomColor: colors.border }]}>
        <Pressable testID="admin-back-button" onPress={() => router.back()} style={[styles.iconBtn, { backgroundColor: colors.surfaceTertiary }]}>
          <Ionicons name="chevron-back" size={24} color={colors.onSurface} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.onSurface }]}>Admin Dashboard</Text>
          <Text testID="admin-video-count" style={{ color: colors.muted, fontSize: 13 }}>{videos.length} videos published</Text>
        </View>
      </View>
      {isLoading ? <ActivityIndicator color={colors.brandPrimary} style={{ marginTop: spacing.xl }} /> : (
        <FlatList
          data={videos}
          keyExtractor={(v: any) => v.video_id}
          onRefresh={refetch}
          refreshing={isRefetching}
          contentContainerStyle={{ padding: spacing.xl, gap: spacing.md, paddingBottom: insets.bottom + 100 }}
          ListEmptyComponent={<Text style={{ color: colors.muted, textAlign: "center" }}>No videos uploaded yet. Tap + to start.</Text>}
          renderItem={({ item: v }: any) => (
            <View testID={`admin-video-${v.video_id}`} style={[styles.row, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
              {v.thumbnail_url ? <Image source={{ uri: v.thumbnail_url }} style={styles.thumb} /> : (
                <View style={[styles.thumb, { backgroundColor: colors.surfaceTertiary, alignItems: "center", justifyContent: "center" }]}>
                  <Ionicons name="videocam" size={28} color={colors.muted} />
                </View>
              )}
              <View style={{ flex: 1, padding: spacing.md }}>
                <Text style={{ color: colors.onSurface, fontWeight: "700" }} numberOfLines={2}>{v.title}</Text>
                <View style={{ flexDirection: "row", gap: 6, marginTop: 6 }}>
                  <View style={[styles.chip, { backgroundColor: colors.surfaceTertiary }]}>
                    <Text style={{ fontSize: 10, fontWeight: "800", color: colors.onSurfaceTertiary }}>{v.source_type === "upload" ? "UPLOAD" : "LINK"}</Text>
                  </View>
                  {v.is_premium ? (
                    <View style={[styles.chip, { backgroundColor: colors.brandSecondary }]}>
                      <Text style={{ fontSize: 10, fontWeight: "800", color: colors.onBrandSecondary }}>PREMIUM</Text>
                    </View>
                  ) : null}
                </View>
              </View>
              {confirmId === v.video_id ? (
                <Pressable testID={`admin-confirm-delete-${v.video_id}`} onPress={() => remove(v.video_id)} style={[styles.del, { backgroundColor: colors.error }]}>
                  <Text style={{ color: colors.onError, fontWeight: "800", fontSize: 12 }}>Delete?</Text>
                </Pressable>
              ) : (
                <Pressable testID={`admin-delete-${v.video_id}`} onPress={() => setConfirmId(v.video_id)} style={styles.del}>
                  <Ionicons name="trash-outline" size={22} color={colors.error} />
                </Pressable>
              )}
            </View>
          )}
        />
      )}
      <Pressable
        testID="admin-add-video-fab"
        onPress={() => router.push("/admin/upload")}
        style={[styles.fab, { backgroundColor: colors.brandPrimary, bottom: insets.bottom + spacing.lg }]}
      >
        <Ionicons name="add" size={32} color={colors.onBrandPrimary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.lg, paddingBottom: spacing.md, borderBottomWidth: 1 },
  iconBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 22, fontWeight: "800" },
  row: { flexDirection: "row", alignItems: "center", borderRadius: radius.md, borderWidth: 1, overflow: "hidden" },
  thumb: { width: 88, height: 80 },
  chip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill },
  del: { minWidth: 56, height: 44, alignItems: "center", justifyContent: "center", marginRight: spacing.sm, borderRadius: radius.sm, paddingHorizontal: 6 },
  fab: { position: "absolute", right: spacing.xl, width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", elevation: 6, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
});
