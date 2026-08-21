import { DEFAULT_SETTINGS, LLM_RUNTIMES, type Settings } from '../../api/connection';

const KEY = 'settings';

type IStorage = Pick<Storage, 'getItem' | 'setItem'>;

function loadSettings(storage: IStorage): Settings {
  const raw = storage.getItem(KEY);
  if (!raw) {
    return DEFAULT_SETTINGS;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<Settings>;
    if (!LLM_RUNTIMES.some((runtime) => runtime.id === parsed.llmRuntimeId)) {
      return DEFAULT_SETTINGS;
    }
    return {
      llmRuntimeId: parsed.llmRuntimeId as Settings['llmRuntimeId'],
      model: parsed.model ?? null,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(storage: IStorage, settings: Settings): void {
  storage.setItem(KEY, JSON.stringify(settings));
}

/** 保管先を束ねた設定ストアを組み立てる。features 側のポートを構造的部分型で満たす。 */
export function createSettingsStore(storage: IStorage) {
  return {
    load: (): Settings => loadSettings(storage),
    save: (settings: Settings): void => saveSettings(storage, settings),
  };
}
