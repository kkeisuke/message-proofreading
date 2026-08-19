import { fetch as tauriFetch } from '@tauri-apps/plugin-http';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import { listModels } from '../adapter/llm/client';
import { createSettingsStore } from '../adapter/storage/settings';
import { baseUrlOf } from '../api/connection';
import { SettingsForm } from '../features/settings';

const store = createSettingsStore(localStorage);

export const Route = createFileRoute('/settings')({
  loader: async () => {
    const { presetId } = store.load();
    try {
      return { models: await listModels(tauriFetch, baseUrlOf(presetId)), error: null };
    } catch (e) {
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
