import { useEffect, useRef, useState } from 'react';
import type { ChatMessage, ChatStreamOptions } from '../api/chat';
import { LLMError, type LLMErrorKind } from '../api/llmError';
import { cleanGeneratedText } from '../domain/cleanGeneratedText';
import { useLLMRuntimeStatus } from './useLLMRuntimeStatus';

/** 生成そのものを行うポート。adapter の実装は routes 層が注入する。 */
export type StreamTextFn = (
  config: { baseUrl: string; model: string },
  messages: ChatMessage[],
  opts: ChatStreamOptions,
) => Promise<string>;

/**
 * 生成失敗の表示用情報。
 * kind で「接続できません」とそれ以外の失敗を分け、message は見出しに、
 * raw は <details> に生のエラー文字列として出す。
 */
export type GenerationError = { kind: LLMErrorKind; message: string; raw: string };

export type GenerationStatus = 'idle' | 'running';

/**
 * LLM への1回の生成を扱う。校正と返信で共通の部分だけを持つ。
 *
 * プロンプトの組立は呼び出し側の責務で、この hook は組み上がった messages を受け取る。
 */
export function useGeneration(streamText: StreamTextFn, baseUrl: string, model: string | null) {
  const [status, setStatus] = useState<GenerationStatus>('idle');
  const [generatedText, setGeneratedText] = useState('');
  const [error, setError] = useState<GenerationError | null>(null);
  const { reportSuccess, reportFailure } = useLLMRuntimeStatus();
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const run = async (messages: ChatMessage[]) => {
    if (!model) {
      return;
    }
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setStatus('running');
    setGeneratedText('');
    setError(null);
    try {
      // ストリーミング中は生テキストを表示し、終了時に必ず整形済みへ差し替える。
      const raw = await streamText({ baseUrl, model }, messages, {
        signal: ac.signal,
        onChunk: (acc) => {
          // 中断直後に届いた先行 run のチャンクが後続 run の表示を上書きしないようにする。
          if (abortRef.current !== ac) {
            return;
          }
          setGeneratedText(acc);
        },
      });
      reportSuccess();
      if (abortRef.current === ac) {
        setGeneratedText(cleanGeneratedText(raw));
      }
    } catch (e) {
      if (abortRef.current !== ac) {
        return;
      }
      if (ac.signal.aborted) {
        // 中断はエラー扱いにしない。途中まで生成された分を整形して残す。
        setGeneratedText(cleanGeneratedText);
      } else {
        reportFailure(e);
        setGeneratedText('');
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
    status,
    generatedText,
    error,
    isModelSelected: model !== null,
    run,
    cancel: () => abortRef.current?.abort(),
  };
}
