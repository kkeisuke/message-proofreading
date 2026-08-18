import { useEffect, useRef, useState } from 'react';
import { cleanup } from '../domain/cleanup';
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
    // ストリーミング中は生テキストを表示し、終了時に必ず整形済みへ差し替える。
    let raw = '';
    try {
      const result = await proofread(input, scene, generate, {
        signal: ac.signal,
        onChunk: (acc) => {
          raw = acc;
          setProposal(acc);
        },
      });
      if (abortRef.current === ac) setProposal(result.proposal);
    } catch (e) {
      if (abortRef.current !== ac) return;
      if (ac.signal.aborted) {
        // 中断はエラー扱いにしない。途中まで生成された分を整形して残す。
        setProposal(cleanup(raw));
      } else {
        setProposal('');
        setError(String(e));
      }
    } finally {
      if (abortRef.current === ac) setPhase('idle');
    }
  };

  const cancel = () => abortRef.current?.abort();

  return { phase, proposal, error, run, cancel };
}
