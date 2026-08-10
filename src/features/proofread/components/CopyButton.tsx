import { useRef } from 'react';
import './CopyButton.css';

type Props = { text: string; disabled: boolean };

export function CopyButton({ text, disabled }: Props) {
  const toastRef = useRef<HTMLDivElement>(null);

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    toastRef.current?.showPopover();
    setTimeout(() => toastRef.current?.hidePopover(), 1500);
  };

  return (
    <>
      <button type="button" className="copy-button" disabled={disabled} onClick={copy}>
        コピー
      </button>
      <div ref={toastRef} className="copy-toast" popover="manual">
        コピーしました
      </div>
    </>
  );
}
