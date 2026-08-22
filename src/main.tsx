import { fetch as tauriFetch } from '@tauri-apps/plugin-http';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { fetchModels } from './adapter/llm/client';
import { createSettingsStore } from './adapter/storage/settings';
import { getLLMRuntimeById } from './api/llmRuntime';
import { SettingsProvider } from './features/settings';
import { LLMRuntimeStatusProvider } from './hooks/useLLMRuntimeStatus';
import { routeTree } from './routeTree.gen';
import './styles/global.css';

const router = createRouter({ routeTree });
const settingsStore = createSettingsStore(localStorage);
const initialBaseUrl = getLLMRuntimeById(settingsStore.load().llmRuntimeId).baseUrl;

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SettingsProvider store={settingsStore}>
      <LLMRuntimeStatusProvider
        fetchModels={(baseUrl) => fetchModels(tauriFetch, baseUrl)}
        initialBaseUrl={initialBaseUrl}
      >
        <RouterProvider router={router} />
      </LLMRuntimeStatusProvider>
    </SettingsProvider>
  </StrictMode>,
);
