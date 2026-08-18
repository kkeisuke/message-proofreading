import { fetch as tauriFetch } from '@tauri-apps/plugin-http';
import { useEffect, useState } from 'react';
import { listModels } from '../adapter/llm/client';
import { loadSettings } from '../adapter/storage/settings';
import { baseUrlOf } from '../domain/connection';
import './ConnectionStatus.css';

export function ConnectionStatus() {
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    const check = async () => {
      try {
        await listModels(tauriFetch, baseUrlOf(loadSettings(localStorage).presetId));
        setOk(true);
      } catch {
        setOk(false);
      }
    };
    check();
    const timer = setInterval(check, 15_000);
    return () => clearInterval(timer);
  }, []);

  if (ok === null) return null;
  return (
    <span className="connection-status" data-ok={ok}>
      {ok ? '接続中' : '未接続'}
    </span>
  );
}
