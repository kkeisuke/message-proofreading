/**
 * 接続先（ローカル LLM サーバー）のプリセットと、接続設定の型。
 *
 * api/ は LLM API との契約を定義する側で、I/O を持たない。
 * 実際に通信するのは adapter/llm で、この型は adapter と feature の双方から参照される。
 */
export const LLM_RUNTIMES = [
  {
    id: 'model-runner',
    label: 'Docker Model Runner',
    baseUrl: 'http://localhost:12434/engines/v1',
    llmStartHint: 'docker desktop enable model-runner --tcp=12434 を実行してください',
  },
  {
    id: 'ollama',
    label: 'Ollama',
    baseUrl: 'http://localhost:11434/v1',
    llmStartHint: 'ollama serve を実行してください',
  },
] as const;

export type LLMRuntimeId = (typeof LLM_RUNTIMES)[number]['id'];

export type Settings = {
  llmRuntimeId: LLMRuntimeId;
  model: string | null;
};

export const DEFAULT_SETTINGS: Settings = { llmRuntimeId: 'model-runner', model: null };

export const getLLMRuntimeById = (llmRuntimeId: LLMRuntimeId) =>
  LLM_RUNTIMES.find((runtime) => runtime.id === llmRuntimeId)!;
