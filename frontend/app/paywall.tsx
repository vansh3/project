import { View, Text, StyleSheet, ScrollView, Pressable, Modal, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import Ionicons from "@react-native-vector-icons/ionicons";
import type { PurchasesPackage } from "react-native-purchases";

import { useAuth } from "@/src/auth";
import { useTheme, spacing, radius } from "@/src/theme";
import { apiFetch } from "@/src/api";
import { Button } from "@/src/components/Button";
import { checkoutHtml, openWebCheckout } from "@/src/razorpay";
import { rcEnabled, useSubscription, REVENUECAT_ENTITLEMENT_IDENTIFIER } from "@/lib/revenuecat";

const PERKS = [
  "Every daily emotional guidance video",
  "Premium parenting series",
  "New content added every day",
  "Cancel anytime",
];

function packageLabel(pkg: PurchasesPackage): string {
  const t = pkg.packageType;
  if (t === "ANNUAL") return "YEARLY";
  if (t === "MONTHLY") return "MONTHLY";
  if (t === "WEEKLY") return "WEEKLY";
  if (t === "LIFETIME") return "LIFETIME";
  return pkg.identifier.toUpperCase();
}

export default function Paywall() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { user, refresh } = useAuth();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [html, setHtml] = useState<string | null>(null);

  const verify = async (r: any) => {
    try {
      await apiFetch("/payments/verify", { method: "POST", body: JSON.stringify(r) });
      await refresh();
      setMsg({ text: "Premium unlocked! Enjoy all videos.", ok: true });
    } catch (e: any) {
      setMsg({ text: e.message || "Verification failed", ok: false });
    }
  };

  const subscribe = async () => {
    setMsg(null);
    setLoading(true);
    try {
      const s = await apiFetch("/payments/subscription", { method: "POST" });
      const opts = { key: s.key_id, subscription_id: s.subscription_id, email: user?.email, name: user?.name };
      if (Platform.OS === "web") {
        const r = await openWebCheckout(opts);
        await verify(r);
      } else {
        setHtml(checkoutHtml(opts));
      }
    } catch (e: any) {
      if (e.message !== "dismissed") setMsg({ text: e.message || "Could not start checkout", ok: false });
    } finally {
      setLoading(false);
    }
  };

  const onMessage = async (ev: any) => {
    let m: any = {};
    try { m = JSON.parse(ev.nativeEvent.data); } catch {}
    setHtml(null);
    if (m.type === "success") await verify(m.data);
    else if (m.type === "failed") setMsg({ text: m.error || "Payment failed", ok: false });
  };

  if (rcEnabled) {
    return <RevenueCatPaywall onDone={() => router.back()} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + spacing.md, paddingHorizontal: spacing.xl, paddingBottom: spacing.xl }}>
        <Pressable testID="paywall-close-button" onPress={() => router.back()} style={[styles.close, { backgroundColor: colors.surfaceTertiary }]}>
          <Ionicons name="close" size={24} color={colors.onSurface} />
        </Pressable>
        <View style={[styles.iconWrap, { backgroundColor: colors.brandSecondary }]}>
          <Ionicons name="star" size={48} color={colors.onBrandSecondary} />
        </View>
        <Text style={[styles.title, { color: colors.onSurface }]}>EmotiCoach Premium</Text>
        <Text style={[styles.sub, { color: colors.onSurfaceTertiary }]}>Raise emotionally strong kids with daily expert guidance.</Text>

        <View style={[styles.priceCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.brandPrimary }]}>
          <Text style={{ color: colors.muted, fontWeight: "700" }}>MONTHLY</Text>
          <Text testID="paywall-price" style={[styles.price, { color: colors.onSurface }]}>₹499<Text style={{ fontSize: 16, color: colors.muted }}> / month</Text></Text>
        </View>

        {PERKS.map((p) => (
          <View key={p} style={styles.perk}>
            <Ionicons name="checkmark-circle" size={22} color={colors.success} />
            <Text style={{ color: colors.onSurface, fontSize: 15, marginLeft: spacing.md, flex: 1 }}>{p}</Text>
          </View>
        ))}

        {msg ? (
          <Text testID="paywall-message" style={{ marginTop: spacing.lg, color: msg.ok ? colors.success : colors.error, fontWeight: "700", textAlign: "center" }}>{msg.text}</Text>
        ) : null}
      </ScrollView>
      <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: insets.bottom + spacing.lg, borderTopWidth: 1, borderTopColor: colors.border }}>
        {user?.premium ? (
          <Button testID="paywall-done-button" title="You're Premium - Continue" variant="tertiary" onPress={() => router.back()} />
        ) : (
          <Button testID="paywall-subscribe-button" title="Subscribe with Razorpay" loading={loading} onPress={subscribe}
            icon={<Ionicons name="lock-closed" size={18} color={colors.onBrandPrimary} />} />
        )}
        <Text style={{ textAlign: "center", color: colors.muted, fontSize: 12, marginTop: spacing.sm }}>Secure payment by Razorpay · UPI, cards, netbanking</Text>
      </View>

      <Modal visible={!!html} animationType="slide" onRequestClose={() => setHtml(null)}>
        <View style={{ flex: 1, paddingTop: insets.top, backgroundColor: colors.surface }}>
          <Pressable testID="checkout-close-button" onPress={() => setHtml(null)} style={{ padding: spacing.lg }}>
            <Ionicons name="close" size={26} color={colors.onSurface} />
          </Pressable>
          {html ? (
            <WebView originWhitelist={["*"]} source={{ html, baseUrl: "https://checkout.razorpay.com" }} onMessage={onMessage} javaScriptEnabled style={{ flex: 1 }} />
          ) : null}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  close: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", alignSelf: "flex-end" },
  iconWrap: { width: 88, height: 88, borderRadius: 44, alignItems: "center", justifyContent: "center", alignSelf: "center", marginTop: spacing.md },
  title: { fontSize: 28, fontWeight: "800", textAlign: "center", marginTop: spacing.lg },
  sub: { fontSize: 15, textAlign: "center", marginTop: spacing.sm, lineHeight: 22 },
  priceCard: { borderWidth: 2, borderRadius: radius.lg, padding: spacing.xl, alignItems: "center", marginVertical: spacing.xl },
  price: { fontSize: 40, fontWeight: "800", marginTop: spacing.xs },
  perk: { flexDirection: "row", alignItems: "center", marginBottom: spacing.md },
});

function RevenueCatPaywall({ onDone }: { onDone: () => void }) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { user, refresh, purchaseIdentityError } = useAuth();
  const { offerings, isSubscribed, identityReady, isLoading, purchase, restore, isPurchasing, isRestoring } = useSubscription();
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [confirmPkg, setConfirmPkg] = useState<PurchasesPackage | null>(null);
  const [selected, setSelected] = useState<PurchasesPackage | null>(null);

  const packages = offerings?.current?.availablePackages ?? [];
  const active = selected ?? packages[0] ?? null;
  const premium = !!user?.premium || isSubscribed;

  const syncPremium = async (activeNow: boolean) => {
    try {
      await apiFetch("/payments/revenuecat/sync", { method: "POST", body: JSON.stringify({ active: activeNow }) });
      await refresh();
    } catch {
      // Non-fatal: RevenueCat SDK remains the source of truth even if this sync fails.
    }
  };

  const doPurchase = async (pkg: PurchasesPackage) => {
    setConfirmPkg(null);
    setMsg(null);
    try {
      const info = await purchase(pkg);
      const unlocked = info.entitlements.active[REVENUECAT_ENTITLEMENT_IDENTIFIER] !== undefined;
      if (unlocked) {
        await syncPremium(true);
        setMsg({ text: "Premium unlocked! Enjoy all videos.", ok: true });
      } else {
        setMsg({ text: "Purchase completed but entitlement isn't active yet. Try restoring.", ok: false });
      }
    } catch (e: any) {
      if (e?.userCancelled) return; // silent — user backed out of the sheet
      setMsg({ text: e?.message || "Purchase failed", ok: false });
    }
  };

  const doRestore = async () => {
    setMsg(null);
    try {
      const info = await restore();
      const unlocked = info.entitlements.active[REVENUECAT_ENTITLEMENT_IDENTIFIER] !== undefined;
      await syncPremium(unlocked);
      setMsg(unlocked
        ? { text: "Purchases restored! Premium is active.", ok: true }
        : { text: "No active subscription found to restore.", ok: false });
    } catch (e: any) {
      setMsg({ text: e?.message || "Restore failed", ok: false });
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + spacing.md, paddingHorizontal: spacing.xl, paddingBottom: spacing.xl }}>
        <Pressable testID="paywall-close-button" onPress={onDone} style={[rcStyles.close, { backgroundColor: colors.surfaceTertiary }]}>
          <Ionicons name="close" size={24} color={colors.onSurface} />
        </Pressable>
        <View style={[rcStyles.iconWrap, { backgroundColor: colors.brandSecondary }]}>
          <Ionicons name="star" size={48} color={colors.onBrandSecondary} />
        </View>
        <Text style={[rcStyles.title, { color: colors.onSurface }]}>EmotiCoach Premium</Text>
        <Text style={[rcStyles.sub, { color: colors.onSurfaceTertiary }]}>Raise emotionally strong kids with daily expert guidance.</Text>

        {__DEV__ ? (
          <View style={[rcStyles.testBadge, { backgroundColor: colors.surfaceTertiary }]}>
            <Ionicons name="flask" size={12} color={colors.muted} />
            <Text style={{ color: colors.muted, fontSize: 11, fontWeight: "700", marginLeft: 6 }}>Test Store · simulated purchase</Text>
          </View>
        ) : null}

        {!premium && (
          isLoading ? (
            <Text style={{ textAlign: "center", color: colors.muted, marginTop: spacing.xl }}>Loading plans…</Text>
          ) : packages.length === 0 ? (
            <Text testID="paywall-rc-unavailable" style={{ textAlign: "center", color: colors.muted, marginTop: spacing.xl }}>
              Subscription options are unavailable right now. Please try again later.
            </Text>
          ) : (
            <View style={{ marginTop: spacing.xl, gap: spacing.md }}>
              {packages.map((pkg) => {
                const isActive = active?.identifier === pkg.identifier;
                return (
                  <Pressable
                    key={pkg.identifier}
                    testID={`paywall-package-${pkg.identifier}`}
                    onPress={() => setSelected(pkg)}
                    style={[rcStyles.priceCard, { backgroundColor: colors.surfaceSecondary, borderColor: isActive ? colors.brandPrimary : colors.border }]}
                  >
                    <Text style={{ color: colors.muted, fontWeight: "700" }}>{packageLabel(pkg)}</Text>
                    <Text style={[rcStyles.price, { color: colors.onSurface }]}>{pkg.product.priceString}</Text>
                    {pkg.product.introPrice ? (
                      <Text style={{ color: colors.success, fontSize: 12, fontWeight: "700" }}>Free trial included</Text>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          )
        )}

        {PERKS.map((p) => (
          <View key={p} style={rcStyles.perk}>
            <Ionicons name="checkmark-circle" size={22} color={colors.success} />
            <Text style={{ color: colors.onSurface, fontSize: 15, marginLeft: spacing.md, flex: 1 }}>{p}</Text>
          </View>
        ))}

        {purchaseIdentityError ? (
          <Text testID="paywall-identity-error" style={{ marginTop: spacing.lg, color: colors.error, fontWeight: "700", textAlign: "center" }}>
            Couldn&apos;t prepare purchases for your account. Please try again shortly.
          </Text>
        ) : null}

        {msg ? (
          <Text testID="paywall-message" style={{ marginTop: spacing.lg, color: msg.ok ? colors.success : colors.error, fontWeight: "700", textAlign: "center" }}>{msg.text}</Text>
        ) : null}
      </ScrollView>

      <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: insets.bottom + spacing.lg, borderTopWidth: 1, borderTopColor: colors.border, gap: spacing.sm }}>
        {premium ? (
          <Button testID="paywall-done-button" title="You're Premium - Continue" variant="tertiary" onPress={onDone} />
        ) : (
          <Button
            testID="paywall-subscribe-button"
            title="Subscribe"
            loading={isPurchasing}
            disabled={!active || !identityReady}
            onPress={() => active && setConfirmPkg(active)}
            icon={<Ionicons name="lock-closed" size={18} color={colors.onBrandPrimary} />}
          />
        )}
        {!premium && (
          <Button testID="paywall-restore-button" title="Restore Purchases" variant="secondary" loading={isRestoring} onPress={doRestore} />
        )}
        <Text style={{ textAlign: "center", color: colors.muted, fontSize: 12 }}>Secure in-app purchase via the App Store / Play Store</Text>
      </View>

      <Modal visible={!!confirmPkg} transparent animationType="fade" onRequestClose={() => setConfirmPkg(null)}>
        <View style={rcStyles.modalBackdrop}>
          <View style={[rcStyles.modalCard, { backgroundColor: colors.surface }]}>
            <Text style={[rcStyles.modalTitle, { color: colors.onSurface }]}>Confirm subscription</Text>
            <Text style={{ color: colors.onSurfaceTertiary, textAlign: "center", marginTop: spacing.sm }}>
              {confirmPkg ? `You'll be charged ${confirmPkg.product.priceString} (${packageLabel(confirmPkg).toLowerCase()}).` : ""}
            </Text>
            <View style={{ flexDirection: "row", gap: spacing.md, marginTop: spacing.xl, width: "100%" }}>
              <View style={{ flex: 1 }}>
                <Button testID="paywall-confirm-cancel" title="Cancel" variant="secondary" onPress={() => setConfirmPkg(null)} />
              </View>
              <View style={{ flex: 1 }}>
                <Button testID="paywall-confirm-purchase" title="Confirm" onPress={() => confirmPkg && doPurchase(confirmPkg)} />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const rcStyles = StyleSheet.create({
  close: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", alignSelf: "flex-end" },
  iconWrap: { width: 88, height: 88, borderRadius: 44, alignItems: "center", justifyContent: "center", alignSelf: "center", marginTop: spacing.md },
  title: { fontSize: 28, fontWeight: "800", textAlign: "center", marginTop: spacing.lg },
  sub: { fontSize: 15, textAlign: "center", marginTop: spacing.sm, lineHeight: 22 },
  testBadge: { flexDirection: "row", alignItems: "center", alignSelf: "center", paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.pill, marginTop: spacing.md },
  priceCard: { borderWidth: 2, borderRadius: radius.lg, padding: spacing.xl, alignItems: "center" },
  price: { fontSize: 32, fontWeight: "800", marginTop: spacing.xs },
  perk: { flexDirection: "row", alignItems: "center", marginTop: spacing.md },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center", padding: spacing.xl },
  modalCard: { width: "100%", borderRadius: radius.lg, padding: spacing.xl, alignItems: "center" },
  modalTitle: { fontSize: 18, fontWeight: "800" },
});

