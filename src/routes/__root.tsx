import { fetch as tauriFetch } from '@tauri-apps/plugin-http';
import { createRootRoute, Outlet } from '@tanstack/react-router';
import { listModels } from '../adapter/llm/client';
import { createSettingsStore } from '../adapter/storage/settings';
import { baseUrlOf } from '../api/connection';
import { AppHeader } from '../components/AppHeader';
import { reportConnection, reportConnectionError } from '../hooks/useConnection';

const store = createSettingsStore(localStorage);

export const Route = createRootRoute({
  /**
   * 起動時に 1 回だけ接続を確認する。以降の接続状態は、設定画面のローダーと校正の
   * generate が実際の通信結果を報告して更新する。
   *
   * 接続先は設定変更に追随するよう、そのときの設定から読む。
   */
  loader: async () => {
    try {
      await listModels(tauriFetch, baseUrlOf(store.load().llmRuntimeId));
      reportConnection(true);
    } catch (e) {
      reportConnectionError(e);
    }
  },
  component: () => (
    <>
      <AppHeader />
      <Outlet />
    </>
  ),
});
