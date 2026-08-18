import { useEffect, useRef, useState } from 'react';
import { LlmError, type LlmErrorKind } from '../../../domain/llmError';
import { cleanup } from '../domain/cleanup';
import { proofread } from '../domain/proofread';
import type { GenerateFn } from '../domain/proofread';
import type { Scene } from '../domain/prompts';

/**
 * 校正失敗の表示用情報。
 * kind で「接続できません」とそれ以外の失敗を分け、message は見出しに、
 * raw は <details> に生のエラー文字列として出す。
 */
export type ProofreadError = { kind: LlmErrorKind; message: string; raw: string };

export function useProofread(generate: GenerateFn) {
  const [phase, setPhase] = useState<'idle' | 'running'>('idle');
  const [proposal, setProposal] = useState('');
  const [error, setError] = useState<ProofreadError | null>(null);
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
          // 中断直後に届いた先行 run のチャンクが後続 run の表示を上書きしないようにする。
          if (abortRef.current !== ac) return;
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
        setError(
          e instanceof LlmError
            ? { kind: e.kind, message: e.message, raw: String(e) }
            : { kind: 'other', message: String(e), raw: String(e) },
        );
      }
    } finally {
      if (abortRef.current === ac) setPhase('idle');
    }
  };

  const cancel = () => abortRef.current?.abort();

  return { phase, proposal, error, run, cancel };
}
