import { useLLMRuntimeStatus } from '../hooks/useLLMRuntimeStatus';
import './ConnectionStatus.css';

type Props = { llmRuntimeLabel: string };

export function ConnectionStatus({ llmRuntimeLabel }: Props) {
  const { connected } = useLLMRuntimeStatus();

  if (connected === null) {
    return null;
  }
  return (
    <span className="connection-status" data-status={connected ? 'connected' : 'disconnected'}>
      {llmRuntimeLabel} {connected ? '接続済み' : '未接続'}
    </span>
  );
}
