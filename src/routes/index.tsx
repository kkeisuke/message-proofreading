import { fetch as tauriFetch } from '@tauri-apps/plugin-http';
import { createFileRoute } from '@tanstack/react-router';
import { useMemo } from 'react';
import { streamChat } from '../adapter/llm/client';
import { createSettingsStore } from '../adapter/storage/settings';
import { baseUrlOf, llmStartHintOf } from '../api/connection';
import { ProofreadPage, type GenerateFn } from '../features/proofread';
import { reportConnection, reportConnectionError } from '../hooks/useConnection';

const store = createSettingsStore(localStorage);

export const Route = createFileRoute('/')({
  loader: () => store.load(),
  component: IndexPage,
});

function IndexPage() {
  const settings = Route.useLoaderData();
  const generate: GenerateFn | null = useMemo(() => {
    const model = settings.model;
    if (!model) return null;
    const config = { baseUrl: baseUrlOf(settings.llmRuntimeId), model };
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
  }, [settings.llmRuntimeId, settings.model]);
  return <ProofreadPage generate={generate} llmStartHint={llmStartHintOf(settings.llmRuntimeId)} />;
}
