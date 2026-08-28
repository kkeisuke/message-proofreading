import { getButtonActivationProps } from '../../../components/buttonActivation';
import type { GenerationStatus } from '../../../hooks/useGeneration';
import './ProofreadButton.css';

type Props = {
  status: GenerationStatus;
  canRun: boolean;
  onRun: () => void;
  onCancel: () => void;
};

export function ProofreadButton({ status, canRun, onRun, onCancel }: Props) {
  if (status === 'running') {
    return (
      <button type="button" className="proofread-button" {...getButtonActivationProps(onCancel)}>
        中断
      </button>
    );
  }
  return (
    <button
      type="button"
      className="proofread-button"
      disabled={!canRun}
      {...getButtonActivationProps(onRun)}
    >
      校正する
    </button>
  );
}
