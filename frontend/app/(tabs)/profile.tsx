import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@react-native-vector-icons/ionicons";

import { useAuth } from "@/src/auth";
import { useTheme, spacing, radius } from "@/src/theme";
import { Button } from "@/src/components/Button";

export default function Profile() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.surface }}
      contentContainerStyle={{ paddingTop: insets.top + spacing.md, paddingBottom: spacing.xl, paddingHorizontal: spacing.xl }}
      testID="profile-screen"
    >
      <Text style={[styles.title, { color: colors.onSurface }]}>Profile</Text>

      <View style={[styles.userCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
        <View style={[styles.avatar, { backgroundColor: colors.brandPrimary }]}>
          <Text style={{ fontSize: 28, fontWeight: "800", color: colors.onBrandPrimary }}>
            {(user?.name || "U").slice(0, 1).toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1, marginLeft: spacing.lg }}>
          <Text style={[styles.name, { color: colors.onSurface }]} testID="profile-name">{user?.name}</Text>
          <Text style={[styles.email, { color: colors.onSurfaceTertiary }]} testID="profile-email">{user?.email}</Text>
          <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm }}>
            {user?.role === "admin" ? (
              <View style={[styles.chip, { backgroundColor: colors.brandTertiary }]}>
                <Text style={{ color: colors.onBrandTertiary, fontSize: 11, fontWeight: "700" }}>ADMIN</Text>
              </View>
            ) : null}
            <View style={[styles.chip, { backgroundColor: user?.premium ? colors.brandSecondary : colors.surfaceTertiary }]}>
              <Text style={{ color: user?.premium ? colors.onBrandSecondary : colors.onSurfaceTertiary, fontSize: 11, fontWeight: "700" }}>
                {user?.premium ? "PREMIUM" : "FREE"}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {!user?.premium && user?.role !== "admin" && (
        <Pressable
          testID="profile-upgrade-button"
          onPress={() => router.push("/paywall")}
          style={[styles.upgrade, { backgroundColor: colors.brandSecondary }]}
        >
          <Ionicons name="star" size={28} color={colors.onBrandSecondary} />
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <Text style={{ fontSize: 16, fontWeight: "800", color: colors.onBrandSecondary }}>Upgrade to Premium</Text>
            <Text style={{ fontSize: 13, color: colors.onBrandSecondary, opacity: 0.85 }}>Unlock all guidance videos</Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color={colors.onBrandSecondary} />
        </Pressable>
      )}

      {user?.role === "admin" && (
        <Pressable
          testID="profile-admin-button"
          onPress={() => router.push("/admin")}
          style={[styles.menuItem, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
        >
          <Ionicons name="shield-checkmark" size={22} color={colors.brandTertiary} />
          <Text style={[styles.menuText, { color: colors.onSurface }]}>Admin Dashboard</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.muted} />
        </Pressable>
      )}

      <View style={{ height: spacing.xl }} />
      <Button title="Sign Out" variant="secondary" onPress={signOut} testID="profile-signout-button" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: "800", marginBottom: spacing.xl },
  userCard: { flexDirection: "row", alignItems: "center", padding: spacing.lg, borderRadius: radius.lg, borderWidth: 1, marginBottom: spacing.lg },
  avatar: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" },
  name: { fontSize: 18, fontWeight: "800" },
  email: { fontSize: 14, marginTop: 2 },
  chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  upgrade: { flexDirection: "row", alignItems: "center", padding: spacing.lg, borderRadius: radius.lg, marginBottom: spacing.md },
  menuItem: { flexDirection: "row", alignItems: "center", padding: spacing.lg, borderRadius: radius.md, borderWidth: 1, marginBottom: spacing.md, gap: spacing.md },
  menuText: { flex: 1, fontSize: 15, fontWeight: "600" },
});
