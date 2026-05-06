import { useEffect, useState } from "react";
import { load, Store } from "@tauri-apps/plugin-store";
import { DEFAULT_SETTINGS, Settings } from "@/lib/types";

let store: Store | null = null;

async function getStore(): Promise<Store> {
  if (!store) {
    store = await load("settings.json", { defaults: {}, autoSave: true });
  }
  return store;
}

export function useSettings() {
  const [settings, setSettingsState] = useState<Settings>(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    getStore().then(async (s) => {
      const loaded: Partial<Settings> = {};
      for (const key of Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[]) {
        const val = await s.get<Settings[typeof key]>(key);
        if (val !== undefined && val !== null) {
          (loaded as Record<string, unknown>)[key] = val;
        }
      }
      setSettingsState({ ...DEFAULT_SETTINGS, ...loaded });
      setReady(true);
    });
  }, []);

  async function updateSettings(patch: Partial<Settings>) {
    const next = { ...settings, ...patch };
    setSettingsState(next);
    const s = await getStore();
    for (const [k, v] of Object.entries(patch)) {
      await s.set(k, v);
    }
  }

  return { settings, updateSettings, ready };
}
