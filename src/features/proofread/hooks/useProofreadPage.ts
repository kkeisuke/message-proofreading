import { useState } from 'react';
import type { GenerateFn } from '../domain/proofread';
import type { UsageScene } from '../domain/prompts';
import { useProofread } from './useProofread';

/** 校正画面が持つ状態を1つにまとめる。コンポーネントは受け取ったものを描くだけにする。 */
export function useProofreadPage(generate: GenerateFn | null) {
  const [input, setInput] = useState('');
  const [scene, setUsageScene] = useState<UsageScene>('business');
  const { phase, proofreadText, error, run, cancel } = useProofread(generate);

  return {
    input,
    setInput,
    scene,
    setUsageScene,
    phase,
    proofreadText,
    error,
    isModelSelected: generate !== null,
    canRun: input.trim().length > 0,
    run: () => run(input.trim(), scene),
    cancel,
  };
}
