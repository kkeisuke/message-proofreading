import { fetch as tauriFetch } from '@tauri-apps/plugin-http';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import { listModels } from '../adapter/llm/client';
import { createSettingsStore } from '../adapter/storage/settings';
import { baseUrlOf } from '../api/connection';
import { SettingsForm } from '../features/settings';
import { reportConnection, reportConnectionError } from '../hooks/useConnection';

const store = createSettingsStore(localStorage);

export const Route = createFileRoute('/settings')({
  loader: async () => {
    const { llmRuntimeId } = store.load();
    try {
      const models = await listModels(tauriFetch, baseUrlOf(llmRuntimeId));
      reportConnection(true);
      return { models, error: null };
    } catch (e) {
      reportConnectionError(e);
      return { models: [], error: String(e) };
    }
  },
  component: SettingsPage,
});

function SettingsPage() {
  const { models, error } = Route.useLoaderData();
  const router = useRouter();
  return (
    <main>
      <SettingsForm
        store={store}
        models={models}
        error={error}
        onPresetChange={() => router.invalidate()}
      />
    </main>
  );
}
