import { useEffect, useRef } from 'react';
import './CopyButton.css';

type Props = { text: string; disabled: boolean };

export function CopyButton({ text, disabled }: Props) {
  const toastRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
    };
  }, []);

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    toastRef.current?.showPopover();
    if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => toastRef.current?.hidePopover(), 1500);
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
