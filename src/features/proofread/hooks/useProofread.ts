import { useEffect, useRef, useState } from 'react';
import { proofread } from '../domain/proofread';
import type { GenerateFn } from '../domain/proofread';
import type { Scene } from '../domain/prompts';

export function useProofread(generate: GenerateFn) {
  const [phase, setPhase] = useState<'idle' | 'running'>('idle');
  const [proposal, setProposal] = useState('');
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const run = async (input: string, scene: Scene) => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setPhase('running');
    setProposal('');
    setError(null);
    try {
      const result = await proofread(input, scene, generate, {
        signal: ac.signal,
        onChunk: setProposal,
      });
      setProposal(result.proposal);
    } catch (e) {
      if (!ac.signal.aborted) setError(String(e));
    } finally {
      if (abortRef.current === ac) setPhase('idle');
    }
  };

  const cancel = () => abortRef.current?.abort();

  return { phase, proposal, error, run, cancel };
}
