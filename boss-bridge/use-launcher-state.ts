"use client";

import { useCallback, useRef, useState } from "react";
import { DEFAULT_FAVORITES, LAUNCHER_APPS } from "./launcher-apps";

const STORAGE_KEY = "bossbridge.launcher";
const KNOWN_IDS = new Set(LAUNCHER_APPS.map((app) => app.id));

type Stored = { favorites: string[]; lastUsed: Record<string, number> };

// The launcher only mounts after a click, never during server render, so reading
// localStorage in the initializer is safe and avoids a flash of the defaults.
function load(): Stored {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null") as Partial<Stored> | null;
    const favorites = Array.isArray(parsed?.favorites) ? parsed.favorites.filter((id) => KNOWN_IDS.has(id)) : DEFAULT_FAVORITES;
    const lastUsed = parsed?.lastUsed && typeof parsed.lastUsed === "object" ? parsed.lastUsed : {};
    return { favorites, lastUsed };
  } catch {
    return { favorites: DEFAULT_FAVORITES, lastUsed: {} };
  }
}

function save(state: Stored) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Private mode or quota: the launcher still works for this page load.
  }
}

/** Favorites (ordered) and last-opened times for the apps launcher, kept in this browser only. */
export function useLauncherState() {
  const [state, setState] = useState<Stored>(load);
  const latest = useRef(state);

  // Saved inside the action, not in an effect: opening an app closes the launcher in the same
  // moment, and an unmounted component never runs its effects.
  const update = useCallback((change: (current: Stored) => Stored) => {
    const next = change(latest.current);
    latest.current = next;
    setState(next);
    save(next);
  }, []);

  const toggleFavorite = useCallback(
    (id: string) => update((cur) => ({ ...cur, favorites: cur.favorites.includes(id) ? cur.favorites.filter((f) => f !== id) : [...cur.favorites, id] })),
    [update],
  );
  const setFavoritesOrder = useCallback((favorites: string[]) => update((cur) => ({ ...cur, favorites })), [update]);
  const recordUsed = useCallback((id: string) => update((cur) => ({ ...cur, lastUsed: { ...cur.lastUsed, [id]: Date.now() } })), [update]);

  return { favorites: state.favorites, lastUsed: state.lastUsed, toggleFavorite, setFavoritesOrder, recordUsed };
}
