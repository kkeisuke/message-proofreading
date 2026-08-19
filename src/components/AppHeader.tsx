import { Link } from '@tanstack/react-router';
import { ConnectionStatus } from './ConnectionStatus';
import './AppHeader.css';

export function AppHeader() {
  return (
    <header className="app-header">
      <Link to="/">メッセージ校正</Link>
      <Link to="/settings">設定</Link>
      <ConnectionStatus />
    </header>
  );
}
