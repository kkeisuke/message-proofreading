import type { LLMRuntimeId } from './llmRuntime';

export type Settings = {
  llmRuntimeId: LLMRuntimeId;
  model: string | null;
};

export const DEFAULT_SETTINGS: Settings = { llmRuntimeId: 'model-runner', model: null };
