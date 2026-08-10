import { fetch as tauriFetch } from '@tauri-apps/plugin-http';
import { createFileRoute } from '@tanstack/react-router';
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
  const generate: GenerateFn | null = settings.model
    ? (messages, opts) =>
        streamChat(
          tauriFetch,
          { baseUrl: baseUrlOf(settings.presetId), model: settings.model! },
          messages,
          opts,
        )
    : null;
  return <ProofreadScreen generate={generate} />;
}
