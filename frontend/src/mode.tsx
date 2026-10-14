// Parent/Kids app mode — lets a parent hand the device to their kid in a
// locked-down "Kids Mode" (Games-first, no Profile/Admin/Payments access) and
// requires a quick parental-gate challenge to switch back to full Parent Mode.
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type AppMode = "parent" | "kids";
const STORAGE_KEY = "ec_app_mode";

type ModeContextValue = {
  mode: AppMode;
  ready: boolean;
  enterKidsMode: () => void;
  /** Opens the parental gate; on success the caller's onGranted runs and mode flips to parent. */
  requestParentAccess: (onGranted?: () => void) => void;
  gateVisible: boolean;
  resolveGate: (passed: boolean) => void;
};

const ModeContext = createContext<ModeContextValue | null>(null);

export function ModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<AppMode>("parent");
  const [ready, setReady] = useState(false);
  const [gateVisible, setGateVisible] = useState(false);
  const [onGrantedCb, setOnGrantedCb] = useState<(() => void) | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => { if (v === "kids") setMode("kids"); })
      .finally(() => setReady(true));
  }, []);

  const persist = useCallback((m: AppMode) => {
    setMode(m);
    AsyncStorage.setItem(STORAGE_KEY, m).catch(() => {});
  }, []);

  const enterKidsMode = useCallback(() => persist("kids"), [persist]);

  const requestParentAccess = useCallback((onGranted?: () => void) => {
    setOnGrantedCb(() => onGranted || null);
    setGateVisible(true);
  }, []);

  const resolveGate = useCallback((passed: boolean) => {
    setGateVisible(false);
    if (passed) {
      persist("parent");
      onGrantedCb?.();
    }
    setOnGrantedCb(null);
  }, [persist, onGrantedCb]);

  return (
    <ModeContext.Provider value={{ mode, ready, enterKidsMode, requestParentAccess, gateVisible, resolveGate }}>
      {children}
    </ModeContext.Provider>
  );
}

export function useAppMode() {
  const ctx = useContext(ModeContext);
  if (!ctx) throw new Error("useAppMode must be used within a ModeProvider");
  return ctx;
}
