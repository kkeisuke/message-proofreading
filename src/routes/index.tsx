import { fetch as tauriFetch } from '@tauri-apps/plugin-http';
import { createFileRoute } from '@tanstack/react-router';
import { useMemo } from 'react';
import { streamChat } from '../adapter/llm/client';
import { createSettingsStore } from '../adapter/storage/settings';
import { baseUrlOf, startHintOf } from '../api/connection';
import { ProofreadScreen, type GenerateFn } from '../features/proofread';

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
    return (messages, opts) =>
      streamChat(tauriFetch, { baseUrl: baseUrlOf(settings.presetId), model }, messages, opts);
  }, [settings.presetId, settings.model]);
  return <ProofreadScreen generate={generate} startHint={startHintOf(settings.presetId)} />;
}
