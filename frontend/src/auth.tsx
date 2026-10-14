import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { Platform } from "react-native";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import Purchases from "react-native-purchases";
import { apiFetch, setToken, getToken } from "./api";
import { rcEnabled } from "@/lib/revenuecat";

WebBrowser.maybeCompleteAuthSession();

export type AppUser = {
  user_id: string;
  email: string;
  name: string;
  role: "user" | "admin";
  premium: boolean;
  picture?: string | null;
};

type AuthState = {
  user: AppUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
  purchaseIdentityError: string | null;
};

const AuthContext = createContext<AuthState | null>(null);

const processedSessionIds = new Set<string>();

function extractSessionIdFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const m = url.match(/[?#&]session_id=([^&#]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchaseIdentityError, setPurchaseIdentityError] = useState<string | null>(null);
  const rcIdentityRef = useRef<string | null>(null);

  const loadMe = useCallback(async () => {
    try {
      const data = await apiFetch("/auth/me");
      setUser(data.user);
    } catch (e: any) {
      if (e.status === 401) {
        await setToken(null);
        setUser(null);
      }
    }
  }, []);

  const exchangeSessionId = useCallback(async (sid: string) => {
    if (processedSessionIds.has(sid)) return;
    processedSessionIds.add(sid);
    try {
      const data = await apiFetch("/auth/session", {
        method: "POST",
        body: JSON.stringify({ session_id: sid }),
      });
      await setToken(data.session_token);
      setUser(data.user);
    } catch (e) {
      console.error("session exchange failed", e);
    }
  }, []);

  useEffect(() => {
    (async () => {
      // Web: process ?session_id or #session_id first
      if (Platform.OS === "web" && typeof window !== "undefined") {
        const urlStr = window.location.href;
        const sid = extractSessionIdFromUrl(urlStr);
        if (sid) {
          await exchangeSessionId(sid);
          // clean URL
          try {
            const url = new URL(window.location.href);
            url.searchParams.delete("session_id");
            const cleanHash = url.hash.replace(/[?#&]?session_id=[^&]+/, "");
            window.history.replaceState(window.history.state, "", url.pathname + url.search + cleanHash);
          } catch {}
          setLoading(false);
          return;
        }
      } else {
        // Mobile: cold start URL
        const initial = await Linking.getInitialURL();
        const sid = extractSessionIdFromUrl(initial);
        if (sid) await exchangeSessionId(sid);
      }

      const existing = await getToken();
      if (existing) {
        await loadMe();
      }
      setLoading(false);
    })();

    // Hot deep link listener (mobile)
    const sub = Linking.addEventListener("url", (ev) => {
      const sid = extractSessionIdFromUrl(ev.url);
      if (sid) exchangeSessionId(sid);
    });
    return () => sub.remove();
  }, [exchangeSessionId, loadMe]);

  // RevenueCat identity binding — COMPULSORY on every auth path (session
  // restore, sign-in, sign-up, sign-out) so purchases map to this backend user.
  useEffect(() => {
    if (!rcEnabled) return;
    (async () => {
      try {
        if (user?.user_id && rcIdentityRef.current !== user.user_id) {
          const { customerInfo } = await Purchases.logIn(user.user_id);
          rcIdentityRef.current = user.user_id;
          setPurchaseIdentityError(null);
          console.log("[RevenueCat] identity bound:", customerInfo.originalAppUserId);
        } else if (!user?.user_id && rcIdentityRef.current) {
          await Purchases.logOut();
          rcIdentityRef.current = null;
        }
      } catch (e) {
        // NEVER swallow this — an anonymous purchase cannot be mapped to the user.
        setPurchaseIdentityError(String(e));
      }
    })();
  }, [user?.user_id]);

  const signIn = async (email: string, password: string) => {
    const data = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    await setToken(data.token);
    setUser(data.user);
  };

  const signUp = async (email: string, password: string, name: string) => {
    const data = await apiFetch("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
    });
    await setToken(data.token);
    setUser(data.user);
  };

  const signInWithGoogle = async () => {
    const redirectUrl =
      Platform.OS === "web"
        ? (typeof window !== "undefined" ? window.location.origin + "/" : "/")
        : Linking.createURL("");
    const authUrl = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
    if (Platform.OS === "web") {
      if (typeof window !== "undefined") window.location.href = authUrl;
      return;
    }
    let captured: string | null = null;
    const sub = Linking.addEventListener("url", (ev) => { captured = ev.url; });
    try {
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);
      let url: string | null = null;
      if (result.type === "success" && (result as any).url) url = (result as any).url;
      if (!url && captured) url = captured;
      if (!url) url = await Linking.getInitialURL();
      const sid = extractSessionIdFromUrl(url);
      if (sid) await exchangeSessionId(sid);
    } finally {
      sub.remove();
    }
  };

  const signOut = async () => {
    try { await apiFetch("/auth/logout", { method: "POST" }); } catch {}
    await setToken(null);
    setUser(null);
  };

  const refresh = async () => { await loadMe(); };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signInWithGoogle, signOut, refresh, purchaseIdentityError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
