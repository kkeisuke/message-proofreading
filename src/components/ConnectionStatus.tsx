import { useConnection } from '../hooks/useConnection';
import './ConnectionStatus.css';

export function ConnectionStatus() {
  const ok = useConnection();

  if (ok === null) return null;
  return (
    <span className="connection-status" data-ok={ok}>
      {ok ? '接続中' : '未接続'}
    </span>
  );
}
