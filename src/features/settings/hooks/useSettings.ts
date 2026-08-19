import { useState } from 'react';
import { loadSettings, saveSettings } from '../../../adapter/storage/settings';
import type { Settings } from '../../../api/connection';

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(() => loadSettings(localStorage));
  const save = (next: Settings) => {
    saveSettings(localStorage, next);
    setSettings(next);
  };
  return { settings, save };
}
