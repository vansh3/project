import { View, Text, StyleSheet, Pressable } from "react-native";
import { useEffect, useState } from "react";
import * as Haptics from "expo-haptics";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GameHeader } from "@/src/components/GameHeader";
import { useTheme, spacing, radius } from "@/src/theme";
import { Button } from "@/src/components/Button";
import { saveProgress } from "@/src/progress";

const FACES = [
  { name: "Happy", icon: "happy", color: "kidSun" },
  { name: "Sad", icon: "sad", color: "kidSky" },
  { name: "Angry", icon: "flame", color: "kidCoral" },
  { name: "Love", icon: "heart", color: "kidPink" },
  { name: "Calm", icon: "leaf", color: "kidLime" },
  { name: "Proud", icon: "trophy", color: "kidOrange" },
] as const;

const BACKS = ["kidBerry", "kidSky", "kidOrange", "kidMint"] as const;

type Card = { id: number; name: string; icon: string; color: (typeof FACES)[number]["color"] };

function shuffle(): Card[] {
  const arr = [...FACES, ...FACES].map((f, idx) => ({ id: idx, ...f }));
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function MemoryCards() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [cards, setCards] = useState<Card[]>(shuffle);
  const [open, setOpen] = useState<number[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const won = matched.length === FACES.length;

  useEffect(() => {
    if (open.length !== 2) return;
    const [a, b] = open.map((id) => cards.find((c) => c.id === id)!);
    setMoves((m) => m + 1);
    if (a.name === b.name) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setMatched((m) => [...m, a.name]);
      setOpen([]);
    } else {
      const t = setTimeout(() => setOpen([]), 800);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => { if (won) saveProgress("memory-cards", Math.max(1, 30 - moves)); }, [won]);

  const flip = (c: Card) => {
    if (open.length >= 2 || open.includes(c.id) || matched.includes(c.name)) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setOpen((o) => [...o, c.id]);
  };

  const reset = () => { setCards(shuffle()); setOpen([]); setMatched([]); setMoves(0); };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <GameHeader title="Memory Cards" score={matched.length} color={colors.kidOrange} />
      <View style={{ flex: 1, padding: spacing.lg }}>
        <Text testID="memory-moves" style={{ color: colors.muted, fontWeight: "700", marginBottom: spacing.md }}>Moves: {moves}</Text>
        <View style={styles.grid}>
          {cards.map((c, idx) => {
            const shown = open.includes(c.id) || matched.includes(c.name);
            return (
              <Pressable
                key={c.id}
                testID={`memory-card-${c.id}`}
                onPress={() => flip(c)}
                style={[styles.card, { backgroundColor: shown ? colors[c.color] : colors[BACKS[idx % BACKS.length]], borderColor: matched.includes(c.name) ? colors.kidSun : "transparent" }]}
              >
                {shown ? (
                  <>
                    <Ionicons name={c.icon as any} size={32} color={colors.onKid} />
                    <Text style={{ color: colors.onKid, fontSize: 12, fontWeight: "800", marginTop: 4 }}>{c.name}</Text>
                  </>
                ) : (
                  <Ionicons name="star" size={28} color="rgba(255,255,255,0.85)" />
                )}
              </Pressable>
            );
          })}
        </View>
        {won && (
          <View style={{ marginTop: spacing.xl, alignItems: "center" }}>
            <Text testID="memory-win" style={{ fontSize: 24, fontWeight: "800", color: colors.onSurface }}>All matched in {moves} moves!</Text>
          </View>
        )}
      </View>
      <View style={{ padding: spacing.xl, paddingBottom: insets.bottom + spacing.xl }}>
        <Button testID="memory-reset" title={won ? "Play Again" : "Shuffle"} variant={won ? "primary" : "secondary"} onPress={reset} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: spacing.md },
  card: { width: "23%", aspectRatio: 0.8, borderRadius: radius.md, alignItems: "center", justifyContent: "center", borderWidth: 3 },
});
