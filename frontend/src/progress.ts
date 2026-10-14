import { apiFetch } from "./api";

export function saveProgress(game_id: string, score: number, completed = true) {
  return apiFetch("/games/progress", {
    method: "POST",
    body: JSON.stringify({ game_id, score, completed }),
  }).catch(() => {});
}
