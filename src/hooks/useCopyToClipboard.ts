import { useEffect, useRef, useState } from 'react';

export type CopyStatus = 'copied' | 'failed';

/**
 * クリップボードへの書き込みと、その結果の通知を扱う。
 *
 * 通知は Popover を直接開閉するため、要素の参照もここで持つ。
 * 画面はこれを CopyButton へ渡す。
 */
export function useCopyToClipboard() {
  const [copyStatus, setCopyStatus] = useState<CopyStatus | null>(null);
  const toastRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const notify = (nextStatus: CopyStatus) => {
    setCopyStatus(nextStatus);
    const toast = toastRef.current;
    if (toast && !toast.matches(':popover-open')) {
      toast.showPopover();
    }
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      const current = toastRef.current;
      if (current?.matches(':popover-open')) {
        current.hidePopover();
      }
    }, 1500);
  };

  // async 関数の Promise を捨てるとコピー失敗が握り潰されるため、必ず両方の結果を通知する。
  // 非セキュアコンテキストでは navigator.clipboard が undefined で、
  // writeText の呼び出し自体が同期的に例外を投げるため try で囲む。
  const copy = (text: string) => {
    try {
      void navigator.clipboard.writeText(text).then(
        () => notify('copied'),
        () => notify('failed'),
      );
    } catch {
      notify('failed');
    }
  };

  return { copyStatus, toastRef, copy };
}
