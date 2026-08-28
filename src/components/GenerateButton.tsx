import type { GenerationStatus } from '../hooks/useGeneration';
import { getButtonActivationProps } from './buttonActivation';
import styles from './GenerateButton.module.css';

type Props = {
  status: GenerationStatus;
  canRun: boolean;
  /** 待機中に出す文言。生成中は「中断」に固定する。 */
  label: string;
  onRun: () => void;
  onCancel: () => void;
};

export function GenerateButton({ status, canRun, label, onRun, onCancel }: Props) {
  if (status === 'running') {
    return (
      <button
        type="button"
        className={styles.generateButton}
        {...getButtonActivationProps(onCancel)}
      >
        中断
      </button>
    );
  }
  return (
    <button
      type="button"
      className={styles.generateButton}
      disabled={!canRun}
      {...getButtonActivationProps(onRun)}
    >
      {label}
    </button>
  );
}
