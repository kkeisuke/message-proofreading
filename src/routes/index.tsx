import { fetch as tauriFetch } from '@tauri-apps/plugin-http';
import { createFileRoute } from '@tanstack/react-router';
import { useMemo } from 'react';
import { streamChat } from '../adapter/llm/client';
import { baseUrlOf, llmStartHintOf } from '../api/connection';
import { ProofreadPage, type GenerateFn } from '../features/proofread';
import { useSettings } from '../features/settings';
import { reportConnection, reportConnectionError } from '../hooks/useConnection';

export const Route = createFileRoute('/')({ component: IndexRoute });

function IndexRoute() {
  const { settings } = useSettings();
  const { llmRuntimeId, model } = settings;
  const baseUrl = baseUrlOf(llmRuntimeId);

  const generate: GenerateFn | null = useMemo(() => {
    if (!model) return null;
    const config = { baseUrl, model };
    return async (messages, opts) => {
      try {
        const proofreadText = await streamChat(tauriFetch, config, messages, opts);
        reportConnection(true);
        return proofreadText;
      } catch (e) {
        // 中断は接続状態を変えない。中断された fetch は unreachable になるため先に見分ける。
        if (opts.signal?.aborted) throw e;
        reportConnectionError(e);
        throw e;
      }
    };
  }, [baseUrl, model]);

  return <ProofreadPage generate={generate} llmStartHint={llmStartHintOf(llmRuntimeId)} />;
}
