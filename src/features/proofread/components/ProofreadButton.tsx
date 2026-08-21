import type { ProofreadPhase } from '../hooks/useProofread';

type Props = {
  phase: ProofreadPhase;
  canRun: boolean;
  onRun: () => void;
  onCancel: () => void;
};

export function ProofreadButton({ phase, canRun, onRun, onCancel }: Props) {
  if (phase === 'running') {
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
