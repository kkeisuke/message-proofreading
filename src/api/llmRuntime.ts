/** 接続先の候補。ここにない URL へは接続しない。 */
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

/**
 * ID からランタイムの定義を引く。
 *
 * @param llmRuntimeId 引きたいランタイムの ID
 * @returns baseUrl と llmStartHint を持つランタイムの定義
 */
export const getLLMRuntimeById = (llmRuntimeId: LLMRuntimeId) =>
  LLM_RUNTIMES.find((runtime) => runtime.id === llmRuntimeId)!;
