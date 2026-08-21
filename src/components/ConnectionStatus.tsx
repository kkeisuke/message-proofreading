import { useConnection } from '../hooks/useConnection';
import './ConnectionStatus.css';

export function ConnectionStatus() {
  const { connected } = useConnection();

  if (connected === null) return null;
  return (
    <span className="connection-status" data-ok={connected}>
      {connected ? '接続中' : '未接続'}
    </span>
  );
}
