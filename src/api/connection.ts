/**
 * 接続先（ローカル LLM サーバー）のプリセットと、接続設定の型。
 *
 * api/ は LLM API との契約を定義する側で、I/O を持たない。
 * 実際に通信するのは adapter/llm で、この型は adapter と feature の双方から参照される。
 */
export const PRESETS = [
  {
    id: 'model-runner',
    label: 'Docker Model Runner',
    baseUrl: 'http://localhost:12434/engines/v1',
    startHint: 'docker desktop enable model-runner --tcp=12434 を実行してください',
  },
  {
    id: 'ollama',
    label: 'Ollama',
    baseUrl: 'http://localhost:11434/v1',
    startHint: 'ollama serve を実行してください',
  },
] as const;

export type PresetId = (typeof PRESETS)[number]['id'];

export type Settings = {
  presetId: PresetId;
  model: string | null;
};

export const DEFAULT_SETTINGS: Settings = { presetId: 'model-runner', model: null };

export const baseUrlOf = (presetId: PresetId): string =>
  PRESETS.find((p) => p.id === presetId)!.baseUrl;

export const startHintOf = (presetId: PresetId): string =>
  PRESETS.find((p) => p.id === presetId)!.startHint;
