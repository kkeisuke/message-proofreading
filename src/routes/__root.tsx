import { createRootRoute, Outlet } from '@tanstack/react-router';
import { AppHeader } from '../components/AppHeader';

export const Route = createRootRoute({
  component: () => (
    <>
      <AppHeader />
      <Outlet />
    </>
  ),
});
