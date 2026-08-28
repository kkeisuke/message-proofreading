import type { RefObject } from 'react';
import type { CopyStatus } from '../hooks/useCopyToClipboard';
import { getButtonActivationProps } from './buttonActivation';
import styles from './CopyButton.module.css';

const MESSAGE: Record<CopyStatus, string> = {
  copied: 'コピーしました',
  failed: 'コピーできませんでした',
};

type Props = {
  copyStatus: CopyStatus | null;
  toastRef: RefObject<HTMLDivElement | null>;
  disabled: boolean;
  onCopy: () => void;
};

export function CopyButton({ copyStatus, toastRef, disabled, onCopy }: Props) {
  return (
    <>
      <button
        type="button"
        className={styles.copyButton}
        disabled={disabled}
        {...getButtonActivationProps(onCopy)}
      >
        コピー
      </button>
      <div
        ref={toastRef}
        className={styles.copyToast}
        data-status={copyStatus ?? ''}
        popover="manual"
      >
        {copyStatus ? MESSAGE[copyStatus] : ''}
      </div>
    </>
  );
}
