import { useState } from 'react';
import type { Settings } from '../../../api/connection';
import type { SettingsStore } from '../domain/settingsStore';

export function useSettings(store: SettingsStore) {
  const [settings, setSettings] = useState<Settings>(() => store.load());
  const save = (next: Settings) => {
    store.save(next);
    setSettings(next);
  };
  return { settings, save };
}
