import { DEFAULT_SETTINGS, PRESETS, type Settings } from '../../domain/connection';

const KEY = 'settings';

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

export function loadSettings(storage: StorageLike): Settings {
  const raw = storage.getItem(KEY);
  if (!raw) return DEFAULT_SETTINGS;
  try {
    const parsed = JSON.parse(raw) as Partial<Settings>;
    if (!PRESETS.some((p) => p.id === parsed.presetId)) return DEFAULT_SETTINGS;
    return { presetId: parsed.presetId as Settings['presetId'], model: parsed.model ?? null };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(storage: StorageLike, settings: Settings): void {
  storage.setItem(KEY, JSON.stringify(settings));
}
