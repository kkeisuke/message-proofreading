import { fetch as tauriFetch } from '@tauri-apps/plugin-http';
import { createFileRoute } from '@tanstack/react-router';
import { fetchModels } from '../adapter/llm/client';
import { SettingsPage } from '../features/settings';

export const Route = createFileRoute('/settings')({ component: SettingsRoute });

function SettingsRoute() {
  return <SettingsPage fetchModels={(baseUrl) => fetchModels(tauriFetch, baseUrl)} />;
}
