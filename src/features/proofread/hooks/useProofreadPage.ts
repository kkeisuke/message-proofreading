import { useEffect, useRef, useState } from 'react';
import type { ChatMessage, ChatStreamOptions } from '../../../api/chat';
import { LLMError, type LLMErrorKind } from '../../../api/llmError';
import { useLLMRuntimeStatus } from '../../../hooks/useLLMRuntimeStatus';
import { cleanGeneratedText } from '../domain/cleanGeneratedText';
import { buildPrompt, type UsageScene } from '../domain/prompts';

/** 生成そのものを行うポート。adapter の実装は routes 層が注入する。 */
export type StreamTextFn = (
  config: { baseUrl: string; model: string },
  messages: ChatMessage[],
  opts: ChatStreamOptions,
) => Promise<string>;

/**
 * 校正失敗の表示用情報。
 * kind で「接続できません」とそれ以外の失敗を分け、message は見出しに、
 * raw は <details> に生のエラー文字列として出す。
 */
export type ProofreadError = { kind: LLMErrorKind; message: string; raw: string };

export type ProofreadStatus = 'idle' | 'running';

/** 校正画面が持つ状態と操作をまとめる。コンポーネントは受け取ったものを描くだけにする。 */
export function useProofreadPage(streamText: StreamTextFn, baseUrl: string, model: string | null) {
  const [input, setInput] = useState('');
  const [usageScene, setUsageScene] = useState<UsageScene>('business');
  const [status, setStatus] = useState<ProofreadStatus>('idle');
  const [proofreadText, setProofreadText] = useState('');
  const [error, setError] = useState<ProofreadError | null>(null);
  const { reportSuccess, reportFailure } = useLLMRuntimeStatus();
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const run = async () => {
    if (!model) {
      return;
    }
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setStatus('running');
    setProofreadText('');
    setError(null);
    try {
      // ストリーミング中は生テキストを表示し、終了時に必ず整形済みへ差し替える。
      const raw = await streamText({ baseUrl, model }, buildPrompt(input.trim(), usageScene), {
        signal: ac.signal,
        onChunk: (acc) => {
          // 中断直後に届いた先行 run のチャンクが後続 run の表示を上書きしないようにする。
          if (abortRef.current !== ac) {
            return;
          }
          setProofreadText(acc);
        },
      });
      reportSuccess();
      if (abortRef.current === ac) {
        setProofreadText(cleanGeneratedText(raw));
      }
    } catch (e) {
      if (abortRef.current !== ac) {
        return;
      }
      if (ac.signal.aborted) {
        // 中断はエラー扱いにしない。途中まで生成された分を整形して残す。
        setProofreadText(cleanGeneratedText);
      } else {
        reportFailure(e);
        setProofreadText('');
        setError(
          e instanceof LLMError
            ? { kind: e.kind, message: e.message, raw: String(e) }
            : { kind: 'other', message: String(e), raw: String(e) },
        );
      }
    } finally {
      if (abortRef.current === ac) {
        setStatus('idle');
      }
    }
  };

  return {
    input,
    setInput,
    usageScene,
    setUsageScene,
    status,
    proofreadText,
    error,
    isModelSelected: model !== null,
    canRun: input.trim().length > 0,
    run,
    cancel: () => abortRef.current?.abort(),
  };
}
