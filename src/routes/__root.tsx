import { fetch as tauriFetch } from '@tauri-apps/plugin-http';
import { createRootRoute, Outlet } from '@tanstack/react-router';
import { useEffect } from 'react';
import { listModels } from '../adapter/llm/client';
import { getLLMRuntimeById } from '../api/connection';
import { AppHeader } from '../components/AppHeader';
import { useSettings } from '../features/settings';
import { useConnection } from '../hooks/useConnection';

export const Route = createRootRoute({ component: RootLayout });

function RootLayout() {
  const { settings } = useSettings();
  const { reportSuccess, reportFailure } = useConnection();
  const { baseUrl } = getLLMRuntimeById(settings.llmRuntimeId);

  /**
   * 起動時と接続先の変更時に到達可否を確かめる。以降の接続状態は、校正とモデル一覧の
   * 実際の通信結果が更新する。
   *
   * active フラグは StrictMode の二重実行と、接続先を切り替えたときに古い結果が
   * 新しい結果を追い越すのを防ぐ。
   */
  useEffect(() => {
    let active = true;
    const check = async () => {
      try {
        await listModels(tauriFetch, baseUrl);
        if (active) reportSuccess();
      } catch (e) {
        if (active) reportFailure(e);
      }
    };
    void check();
    return () => {
      active = false;
    };
  }, [baseUrl, reportSuccess, reportFailure]);

  return (
    <>
      <AppHeader />
      <Outlet />
    </>
  );
}
