// @layer の順序は最初に現れた宣言で決まる。他の import が先にコンポーネントの
// CSS を引き込むと components が先頭になり、reset に負けるため、必ず先頭で読む。
import './styles/global.css';
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
