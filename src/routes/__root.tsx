import { fetch as tauriFetch } from '@tauri-apps/plugin-http';
import { createRootRoute, Outlet } from '@tanstack/react-router';
import { listModels } from '../adapter/llm/client';
import { createSettingsStore } from '../adapter/storage/settings';
import { baseUrlOf } from '../api/connection';
import { AppHeader } from '../components/AppHeader';

const store = createSettingsStore(localStorage);

/**
 * 接続状態の判定。設定変更に追随するよう、接続先は毎回そのときの設定から読む。
 *
 * ConnectionStatus のポーリングが張り直されないよう、参照はモジュールスコープで固定する。
 */
const check = async (): Promise<boolean> => {
  try {
    await listModels(tauriFetch, baseUrlOf(store.load().presetId));
    return true;
  } catch {
    return false;
  }
};

export const Route = createRootRoute({
  component: () => (
    <>
      <AppHeader check={check} />
      <Outlet />
    </>
  ),
});
