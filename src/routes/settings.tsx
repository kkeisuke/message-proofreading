import { fetch as tauriFetch } from '@tauri-apps/plugin-http';
import { createFileRoute } from '@tanstack/react-router';
import { useCallback } from 'react';
import { listModels } from '../adapter/llm/client';
import { SettingsPage } from '../features/settings';

export const Route = createFileRoute('/settings')({ component: SettingsRoute });

function SettingsRoute() {
  // useModelList の依存に入るため、参照を安定させる。
  const fetchModels = useCallback((baseUrl: string) => listModels(tauriFetch, baseUrl), []);
  return <SettingsPage listModels={fetchModels} />;
}
