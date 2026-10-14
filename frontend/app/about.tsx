import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@react-native-vector-icons/ionicons";

import { useTheme, spacing, radius } from "@/src/theme";

const CREDENTIALS = [
  {
    title: "Certified Kids' Emotion Coach",
    issuer: "Certifying body & year — to be added",
  },
];

const HIGHLIGHTS = [
  { icon: "heart", label: "Child-first approach" },
  { icon: "people", label: "Parent & family guidance" },
  { icon: "sparkles", label: "Playful, practical tools" },
];

export default function About() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }} testID="about-screen">
        <View style={[styles.header, { paddingTop: insets.top + spacing.sm, paddingHorizontal: spacing.lg }]}>
          <Pressable testID="about-back-button" onPress={() => router.back()} style={[styles.iconBtn, { backgroundColor: colors.surfaceTertiary }]}>
            <Ionicons name="chevron-back" size={24} color={colors.onSurface} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.onSurface }]}>About the Coach</Text>
          <View style={styles.iconBtn} />
        </View>

        <View style={{ alignItems: "center", marginTop: spacing.md }}>
          <View testID="about-photo-placeholder" style={[styles.avatarWrap, styles.avatarEmpty, { backgroundColor: colors.surfaceTertiary, borderColor: colors.border }]}>
            <Ionicons name="person" size={56} color={colors.muted} />
          </View>
          <Text style={[styles.photoHint, { color: colors.muted }]}>Photo coming soon</Text>

          <Text testID="about-name" style={[styles.name, { color: colors.onSurface }]}>Richa Madan</Text>
          <View style={[styles.roleBadge, { backgroundColor: colors.brandSecondary }]}>
            <Ionicons name="ribbon" size={14} color={colors.onBrandSecondary} />
            <Text style={{ color: colors.onBrandSecondary, fontWeight: "800", fontSize: 12, marginLeft: 6 }}>
              CERTIFIED KIDS&apos; EMOTION COACH
            </Text>
          </View>
        </View>

        <View style={[styles.highlightRow, { paddingHorizontal: spacing.xl }]}>
          {HIGHLIGHTS.map((h) => (
            <View key={h.label} style={[styles.highlightCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
              <Ionicons name={h.icon as any} size={22} color={colors.brandPrimary} />
              <Text style={[styles.highlightLabel, { color: colors.onSurface }]}>{h.label}</Text>
            </View>
          ))}
        </View>

        <View style={{ paddingHorizontal: spacing.xl, marginTop: spacing.xl }}>
          <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>About Richa</Text>
          <Text testID="about-bio" style={[styles.bio, { color: colors.onSurfaceTertiary }]}>
            Richa Madan is a certified Kids&apos; Emotion Coach dedicated to helping children build emotional
            intelligence, resilience, and confidence from an early age. With a passion for social-emotional
            learning, Richa has guided countless parents and children through everyday emotional ups and downs —
            turning tricky moments like tantrums, anxiety, and big feelings into opportunities to connect and grow.
          </Text>
          <Text style={[styles.bio, { color: colors.onSurfaceTertiary, marginTop: spacing.md }]}>
            She created EmotiCoach Kids to bring her coaching approach to every family's pocket: short daily
            videos for parents and playful, feelings-based games for kids, so emotional wellbeing becomes a fun,
            everyday habit rather than a one-time lesson.
          </Text>
        </View>

        <View style={{ paddingHorizontal: spacing.xl, marginTop: spacing.xl }}>
          <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Certifications</Text>
          {CREDENTIALS.map((c) => (
            <View key={c.title} style={[styles.certCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
              <View style={[styles.certImgWrap, { backgroundColor: colors.surfaceTertiary, borderColor: colors.border }]}>
                <Ionicons name="document-text-outline" size={28} color={colors.muted} />
              </View>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text testID="about-cert-title" style={[styles.certTitle, { color: colors.onSurface }]}>{c.title}</Text>
                <Text style={[styles.certIssuer, { color: colors.muted }]}>{c.issuer}</Text>
              </View>
            </View>
          ))}
          <Text style={[styles.certHint, { color: colors.muted }]}>
            Certificate image and full details will be added here soon.
          </Text>
        </View>

        <View style={[styles.quoteBox, { backgroundColor: colors.surfaceTertiary, marginHorizontal: spacing.xl }]}>
          <Ionicons name="chatbox-ellipses" size={22} color={colors.brandPrimary} />
          <Text style={[styles.quote, { color: colors.onSurface }]}>
            "Every big feeling is a chance to teach a small, lasting lesson."
          </Text>
          <Text style={[styles.quoteBy, { color: colors.muted }]}>— Richa Madan</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  iconBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "800" },
  avatarWrap: { width: 128, height: 128, borderRadius: 64, borderWidth: 2, overflow: "hidden" },
  avatarEmpty: { alignItems: "center", justifyContent: "center" },
  photoHint: { fontSize: 12, marginTop: spacing.sm, fontStyle: "italic" },
  name: { fontSize: 26, fontWeight: "800", marginTop: spacing.md },
  roleBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.pill, marginTop: spacing.sm },
  highlightRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.xl },
  highlightCard: { flex: 1, borderRadius: radius.md, borderWidth: 1, padding: spacing.md, alignItems: "center", gap: 6 },
  highlightLabel: { fontSize: 11, fontWeight: "700", textAlign: "center" },
  sectionTitle: { fontSize: 18, fontWeight: "800", marginBottom: spacing.md },
  bio: { fontSize: 15, lineHeight: 23 },
  certCard: { flexDirection: "row", alignItems: "center", borderRadius: radius.md, borderWidth: 1, padding: spacing.md },
  certImgWrap: { width: 56, height: 56, borderRadius: radius.sm, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  certTitle: { fontSize: 15, fontWeight: "700" },
  certIssuer: { fontSize: 12, marginTop: 2 },
  certHint: { fontSize: 12, marginTop: spacing.sm, fontStyle: "italic" },
  quoteBox: { borderRadius: radius.lg, padding: spacing.xl, marginTop: spacing.xl, alignItems: "center", gap: spacing.sm },
  quote: { fontSize: 16, fontWeight: "700", textAlign: "center", lineHeight: 23 },
  quoteBy: { fontSize: 13, fontWeight: "600" },
});
