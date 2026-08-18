import { fetch as tauriFetch } from '@tauri-apps/plugin-http';
import { createFileRoute } from '@tanstack/react-router';
import { useMemo } from 'react';
import { streamChat } from '../adapter/llm/client';
import { loadSettings } from '../adapter/storage/settings';
import { baseUrlOf } from '../domain/connection';
import { ProofreadScreen, type GenerateFn } from '../features/proofread';

export const Route = createFileRoute('/')({
  loader: () => loadSettings(localStorage),
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
  return <ProofreadScreen generate={generate} />;
}
