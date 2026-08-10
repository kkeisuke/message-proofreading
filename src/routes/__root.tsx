import { createRootRoute, Link, Outlet } from '@tanstack/react-router';

export const Route = createRootRoute({
  component: () => (
    <>
      <header className="app-header">
        <Link to="/">メッセージ校正</Link>
        <Link to="/settings">設定</Link>
      </header>
      <Outlet />
    </>
  ),
});
