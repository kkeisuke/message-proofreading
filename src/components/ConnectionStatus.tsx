import { useLLMRuntimeStatus } from '../hooks/useLLMRuntimeStatus';
import './ConnectionStatus.css';

export function ConnectionStatus() {
  const { connected } = useLLMRuntimeStatus();

  if (connected === null) {
    return null;
  }
  return (
    <span className="connection-status" data-status={connected ? 'connected' : 'disconnected'}>
      {connected ? '接続中' : '未接続'}
    </span>
  );
}
