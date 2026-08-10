import { fetch } from '@tauri-apps/plugin-http';
import { useRef, useState } from 'react';

const BASE = 'http://localhost:12434/engines/v1';
const MODEL = 'ai/gemma4:e4b-q4_K_M';

export default function App() {
  const [log, setLog] = useState<string[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const append = (line: string) => setLog((l) => [...l, line]);

  const run = async () => {
    setLog([]);
    const ac = new AbortController();
    abortRef.current = ac;
    const t0 = performance.now();
    const at = () => `+${Math.round(performance.now() - t0)}ms`;
    try {
      const res = await fetch(`${BASE}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: MODEL,
          stream: true,
          messages: [{ role: 'user', content: '1から20まで数えてください。' }],
        }),
        signal: ac.signal,
      });
      append(`${at()} status: ${res.status}`);
      const reader = res.body!.pipeThrough(new TextDecoderStream()).getReader();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        append(`${at()} chunk: ${value.length}文字`);
      }
      append(`${at()} done`);
    } catch (e) {
      append(`${at()} error: ${String(e)}`);
    }
  };

  return (
    <main>
      <h1>通信スパイク</h1>
      <button onClick={run}>ストリーミング開始</button>
      <button onClick={() => abortRef.current?.abort()}>中断</button>
      <pre>{log.join('\n')}</pre>
    </main>
  );
}
