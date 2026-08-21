import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { LLMError } from '../api/llmError';

/**
 * 到達できたうえでの失敗（モデル未検出・生成エラーなど）は、接続できている証拠として扱う。
 * 判定が書き手ごとにずれないよう、ここに集約する。
 */
export const isLLMReachable = (error: unknown): boolean =>
  error instanceof LLMError && error.kind !== 'unreachable';

type ConnectionValue = {
  /** null は「まだ分からない」。起動直後の 1 回目の通信が終わるまでこの状態になる。 */
  connected: boolean | null;
  reportSuccess: () => void;
  reportFailure: (error: unknown) => void;
};

const ConnectionContext = createContext<ConnectionValue | null>(null);

/** 投機的なポーリングはせず、実際に通信した側が結果を報告する。 */
export function ConnectionProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState<boolean | null>(null);
  const reportSuccess = useCallback(() => setConnected(true), []);
  const reportFailure = useCallback((error: unknown) => setConnected(isLLMReachable(error)), []);
  const value = useMemo(
    () => ({ connected, reportSuccess, reportFailure }),
    [connected, reportSuccess, reportFailure],
  );
  return <ConnectionContext value={value}>{children}</ConnectionContext>;
}

export function useConnection(): ConnectionValue {
  const value = useContext(ConnectionContext);
  if (!value) {
    throw new Error('ConnectionProvider の外側で useConnection を呼び出しました');
  }
  return value;
}
