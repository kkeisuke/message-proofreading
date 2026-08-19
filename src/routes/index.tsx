import { fetch as tauriFetch } from '@tauri-apps/plugin-http';
import { createFileRoute } from '@tanstack/react-router';
import { useMemo } from 'react';
import { streamChat } from '../adapter/llm/client';
import { createSettingsStore } from '../adapter/storage/settings';
import { baseUrlOf, startHintOf } from '../api/connection';
import { ProofreadScreen, type GenerateFn } from '../features/proofread';
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
    const config = { baseUrl: baseUrlOf(settings.presetId), model };
    return async (messages, opts) => {
      try {
        const proposal = await streamChat(tauriFetch, config, messages, opts);
        reportConnection(true);
        return proposal;
      } catch (e) {
        // 中断は接続状態を変えない。中断された fetch は unreachable になるため先に見分ける。
        if (opts.signal?.aborted) throw e;
        reportConnectionError(e);
        throw e;
      }
    };
  }, [settings.presetId, settings.model]);
  return <ProofreadScreen generate={generate} startHint={startHintOf(settings.presetId)} />;
}
