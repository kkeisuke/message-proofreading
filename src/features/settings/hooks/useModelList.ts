import { useEffect, useState } from 'react';
import { useConnection } from '../../../hooks/useConnection';

/** モデル一覧の取得ポート。adapter の実装は合成の起点が注入する。 */
export type ListModelsFn = (baseUrl: string) => Promise<string[]>;

export type ModelList =
  | { status: 'loading' }
  | { status: 'ready'; models: string[] }
  | { status: 'error'; message: string };

export function useModelList(listModels: ListModelsFn, baseUrl: string): ModelList {
  const [modelList, setModelList] = useState<ModelList>({ status: 'loading' });
  const { reportSuccess, reportFailure } = useConnection();

  useEffect(() => {
    let active = true;
    setModelList({ status: 'loading' });
    const load = async () => {
      try {
        const models = await listModels(baseUrl);
        if (!active) return;
        reportSuccess();
        setModelList({ status: 'ready', models });
      } catch (e) {
        if (!active) return;
        reportFailure(e);
        setModelList({ status: 'error', message: String(e) });
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [listModels, baseUrl, reportSuccess, reportFailure]);

  return modelList;
}
