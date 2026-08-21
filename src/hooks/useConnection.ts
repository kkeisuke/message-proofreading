import { useSyncExternalStore } from 'react';
import { LLMError } from '../api/llmError';

/**
 * 接続状態をメモリ上に持つストア。
 *
 * 接続の可否は実際にランタイムと通信したときに必ず分かるため、投機的なポーリングは行わない。
 * 通信する側（ルートのローダー・設定のローダー・校正の generate）が結果を報告し、
 * 表示する側（ConnectionStatus）が購読する。
 *
 * null は「まだ分からない」。起動直後の 1 回目の通信が終わるまでこの状態になる。
 */
let connected: boolean | null = null;

const listeners = new Set<() => void>();

/** 通信した側が結果を報告する。値が変わったときだけ購読者に通知する。 */
export function reportConnection(ok: boolean): void {
  if (connected === ok) return;
  connected = ok;
  for (const listener of listeners) listener();
}

/**
 * 通信が例外で終わったときの報告。
 *
 * 到達できたうえでの失敗（モデル未検出・生成エラーなど）は、接続できている証拠として扱う。
 * 到達できなかった場合と、種別の分からない失敗は未接続とする。
 * 判定が書き手ごとにずれないよう、ここに集約する。
 */
export function reportConnectionError(error: unknown): void {
  reportConnection(error instanceof LLMError && error.kind !== 'unreachable');
}

/** useSyncExternalStore の subscribe。戻り値は購読解除。 */
export function subscribeConnection(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** useSyncExternalStore の getSnapshot。boolean | null のプリミティブなのでそのまま返す。 */
export function getConnectionSnapshot(): boolean | null {
  return connected;
}

export function useConnection(): boolean | null {
  return useSyncExternalStore(subscribeConnection, getConnectionSnapshot);
}
