import { useState } from 'react';
import { useGeneration, type StreamTextFn } from '../../../hooks/useGeneration';
import { buildPrompt, type UsageScene } from '../domain/prompts';

/** 校正画面が持つ状態と操作をまとめる。コンポーネントは受け取ったものを描くだけにする。 */
export function useProofreadPage(streamText: StreamTextFn, baseUrl: string, model: string | null) {
  const [input, setInput] = useState('');
  const [usageScene, setUsageScene] = useState<UsageScene>('business');
  const generation = useGeneration(streamText, baseUrl, model);

  return {
    input,
    setInput,
    usageScene,
    setUsageScene,
    status: generation.status,
    proofreadText: generation.generatedText,
    error: generation.error,
    isModelSelected: generation.isModelSelected,
    canRun: input.trim().length > 0,
    run: () => generation.run(buildPrompt(input.trim(), usageScene)),
    cancel: generation.cancel,
  };
}
