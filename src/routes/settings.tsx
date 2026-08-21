import { fetch as tauriFetch } from '@tauri-apps/plugin-http';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import { listModels } from '../adapter/llm/client';
import { createSettingsStore } from '../adapter/storage/settings';
import { baseUrlOf } from '../api/connection';
import { SettingsForm } from '../features/settings';

// loader は React の外で走るため Context を読めない。Task 4 で loader ごと廃止する。
const store = createSettingsStore(localStorage);

export const Route = createFileRoute('/settings')({
  loader: async () => {
    const { llmRuntimeId } = store.load();
    try {
      return { models: await listModels(tauriFetch, baseUrlOf(llmRuntimeId)), error: null };
    } catch (e) {
      return { models: [], error: String(e) };
    }
  },
  component: SettingsRoute,
});

function SettingsRoute() {
  const { models, error } = Route.useLoaderData();
  const router = useRouter();
  return (
    <main>
      <SettingsForm models={models} error={error} onLLMRuntimeChange={() => router.invalidate()} />
    </main>
  );
}
