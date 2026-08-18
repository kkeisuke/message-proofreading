import { createRootRoute, Link, Outlet } from '@tanstack/react-router';
import { ConnectionStatus } from '../components/ConnectionStatus';
import '../components/AppHeader.css';

export const Route = createRootRoute({
  component: () => (
    <>
      <header className="app-header">
        <Link to="/">メッセージ校正</Link>
        <Link to="/settings">設定</Link>
        <ConnectionStatus />
      </header>
      <Outlet />
    </>
  ),
});
