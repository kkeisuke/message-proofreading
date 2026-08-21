import { createRouter, RouterProvider } from '@tanstack/react-router';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createSettingsStore } from './adapter/storage/settings';
import { SettingsProvider } from './features/settings';
import { routeTree } from './routeTree.gen';
import './styles/global.css';

const router = createRouter({ routeTree });
const settingsStore = createSettingsStore(localStorage);

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SettingsProvider store={settingsStore}>
      <RouterProvider router={router} />
    </SettingsProvider>
  </StrictMode>,
);
