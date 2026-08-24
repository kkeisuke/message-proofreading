import { createRootRoute, Outlet } from '@tanstack/react-router';
import { getLLMRuntimeById } from '../api/llmRuntime';
import { AppHeader } from '../components/AppHeader';
import { useSettings } from '../features/settings';

export const Route = createRootRoute({ component: RootRoute });

function RootRoute() {
  const { settings } = useSettings();

  return (
    <>
      <AppHeader llmRuntimeLabel={getLLMRuntimeById(settings.llmRuntimeId).label} />
      <Outlet />
    </>
  );
}
