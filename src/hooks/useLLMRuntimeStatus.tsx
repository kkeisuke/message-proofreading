import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { LLMError } from '../api/llmError';

/**
 * 到達できたうえでの失敗（モデル未検出・生成エラーなど）は、接続できている証拠として扱う。
 * 判定が書き手ごとにずれないよう、ここに集約する。
 */
export const isLLMReachable = (error: unknown): boolean =>
  error instanceof LLMError && error.kind !== 'unreachable';

/** モデル一覧の取得ポート。adapter の実装は合成の起点が注入する。 */
export type FetchModelsFn = (baseUrl: string) => Promise<string[]>;

export type ModelList =
  | { status: 'loading' }
  | { status: 'ready'; models: string[] }
  | { status: 'error' };

type LLMRuntimeStatusValue = {
  /** null は「まだ分からない」。起動直後の 1 回目の通信が終わるまでこの状態になる。 */
  connected: boolean | null;
  modelList: ModelList;
  /** 接続先を確かめ直す。起動時と、接続先を切り替えたときに呼ぶ。 */
  refresh: (baseUrl: string) => void;
  reportSuccess: () => void;
  reportFailure: (error: unknown) => void;
};

const LLMRuntimeStatusContext = createContext<LLMRuntimeStatusValue | null>(null);

/**
 * ランタイムの到達可否とモデル一覧を持つ。
 *
 * どちらも `/v1/models` への 1 回の通信から分かるため、まとめて 1 つの状態にする。
 * 更新するのは起動時・接続先の切り替え時・校正の通信結果の 3 つ。
 */
export function LLMRuntimeStatusProvider({
  fetchModels,
  initialBaseUrl,
  children,
}: {
  fetchModels: FetchModelsFn;
  initialBaseUrl: string;
  children: ReactNode;
}) {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [modelList, setModelList] = useState<ModelList>({ status: 'loading' });
  // 接続先を続けて切り替えたとき、古い応答が新しい応答を追い越さないようにする。
  const requestCount = useRef(0);

  const reportSuccess = useCallback(() => setConnected(true), []);
  const reportFailure = useCallback((error: unknown) => setConnected(isLLMReachable(error)), []);

  const refresh = useCallback(
    (baseUrl: string) => {
      const requestId = ++requestCount.current;
      setModelList({ status: 'loading' });
      const load = async () => {
        try {
          const models = await fetchModels(baseUrl);
          if (requestId !== requestCount.current) {
            return;
          }
          setModelList({ status: 'ready', models });
          setConnected(true);
        } catch (e) {
          if (requestId !== requestCount.current) {
            return;
          }
          setModelList({ status: 'error' });
          setConnected(isLLMReachable(e));
        }
      };
      void load();
    },
    [fetchModels],
  );

  // 起動時に 1 回だけ確かめる（design.md §6）。refresh と initialBaseUrl はどちらも安定した参照。
  useEffect(() => {
    refresh(initialBaseUrl);
  }, [refresh, initialBaseUrl]);

  const value = useMemo(
    () => ({ connected, modelList, refresh, reportSuccess, reportFailure }),
    [connected, modelList, refresh, reportSuccess, reportFailure],
  );
  return <LLMRuntimeStatusContext value={value}>{children}</LLMRuntimeStatusContext>;
}

export function useLLMRuntimeStatus(): LLMRuntimeStatusValue {
  const value = useContext(LLMRuntimeStatusContext);
  if (!value) {
    throw new Error('LLMRuntimeStatusProvider の外側で useLLMRuntimeStatus を呼び出しました');
  }
  return value;
}
