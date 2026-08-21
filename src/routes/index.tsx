import { fetch as tauriFetch } from '@tauri-apps/plugin-http';
import { createFileRoute } from '@tanstack/react-router';
import { useMemo } from 'react';
import { streamChat } from '../adapter/llm/client';
import { getLLMRuntimeById } from '../api/connection';
import { ProofreadPage, type GenerateFn } from '../features/proofread';
import { useSettings } from '../features/settings';
import { useConnection } from '../hooks/useConnection';

export const Route = createFileRoute('/')({ component: IndexRoute });

function IndexRoute() {
  const { settings } = useSettings();
  const { reportSuccess, reportFailure } = useConnection();
  const { llmRuntimeId, model } = settings;
  const { baseUrl, llmStartHint } = getLLMRuntimeById(llmRuntimeId);

  const generate: GenerateFn | null = useMemo(() => {
    if (!model) return null;
    const config = { baseUrl, model };
    return async (messages, opts) => {
      try {
        const proofreadText = await streamChat(tauriFetch, config, messages, opts);
        reportSuccess();
        return proofreadText;
      } catch (e) {
        // 中断は接続状態を変えない。中断された fetch は unreachable になるため先に見分ける。
        if (opts.signal?.aborted) throw e;
        reportFailure(e);
        throw e;
      }
    };
  }, [baseUrl, model, reportSuccess, reportFailure]);

  return <ProofreadPage generate={generate} llmStartHint={llmStartHint} />;
}
