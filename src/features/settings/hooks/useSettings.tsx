import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Settings } from '../../../api/connection';
import type { SettingsStore } from '../domain/settingsStore';

type SettingsValue = {
  settings: Settings;
  saveSettings: (next: Settings) => void;
};

const SettingsContext = createContext<SettingsValue | null>(null);

/** 保管先は合成の起点が注入する。feature は SettingsStore の形だけを知る。 */
export function SettingsProvider({
  store,
  children,
}: {
  store: SettingsStore;
  children: ReactNode;
}) {
  const [settings, setSettings] = useState<Settings>(() => store.load());
  const saveSettings = useCallback(
    (next: Settings) => {
      store.save(next);
      setSettings(next);
    },
    [store],
  );
  const value = useMemo(() => ({ settings, saveSettings }), [settings, saveSettings]);
  return <SettingsContext value={value}>{children}</SettingsContext>;
}

export function useSettings(): SettingsValue {
  const value = useContext(SettingsContext);
  if (!value) throw new Error('SettingsProvider の外側で useSettings を呼び出しました');
  return value;
}
