import { Link } from '@tanstack/react-router';
import { ConnectionStatus } from './ConnectionStatus';
import './AppHeader.css';

type Props = { check: () => Promise<boolean> };

export function AppHeader({ check }: Props) {
  return (
    <header className="app-header">
      <Link to="/">メッセージ校正</Link>
      <Link to="/settings">設定</Link>
      <ConnectionStatus check={check} />
    </header>
  );
}
