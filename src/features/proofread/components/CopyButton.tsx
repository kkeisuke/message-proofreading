import { useEffect, useRef, useState } from 'react';
import './CopyButton.css';

type Props = { text: string; disabled: boolean };

type Status = 'copied' | 'failed';

const MESSAGE: Record<Status, string> = {
  copied: 'コピーしました',
  failed: 'コピーできませんでした',
};

export function CopyButton({ text, disabled }: Props) {
  const [status, setStatus] = useState<Status | null>(null);
  const toastRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
    };
  }, []);

  const notify = (next: Status) => {
    setStatus(next);
    const toast = toastRef.current;
    if (toast && !toast.matches(':popover-open')) toast.showPopover();
    if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      const current = toastRef.current;
      if (current?.matches(':popover-open')) current.hidePopover();
    }, 1500);
  };

  // async 関数の Promise を捨てるとコピー失敗が握り潰されるため、必ず両方の結果を通知する。
  // 非セキュアコンテキストでは navigator.clipboard が undefined で、
  // writeText の呼び出し自体が同期的に例外を投げるため try で囲む。
  const copy = () => {
    try {
      void navigator.clipboard.writeText(text).then(
        () => notify('copied'),
        () => notify('failed'),
      );
    } catch {
      notify('failed');
    }
  };

  return (
    <>
      <button type="button" className="copy-button" disabled={disabled} onClick={copy}>
        コピー
      </button>
      <div ref={toastRef} className="copy-toast" data-status={status ?? ''} popover="manual">
        {status ? MESSAGE[status] : ''}
      </div>
    </>
  );
}
