import type { ProofreadStatus } from '../hooks/useProofreadPage';

type Props = {
  status: ProofreadStatus;
  canRun: boolean;
  onRun: () => void;
  onCancel: () => void;
};

export function ProofreadButton({ status, canRun, onRun, onCancel }: Props) {
  if (status === 'running') {
    return (
      <button type="button" onClick={onCancel}>
        中断
      </button>
    );
  }
  return (
    <button type="button" disabled={!canRun} onClick={onRun}>
      校正する
    </button>
  );
}
