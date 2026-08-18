import { extractDelta, sseEvents } from './sse';

/**
 * tauri-plugin-http の fetch は RequestInit に加えて maxRedirections を受け取る。
 * scope 検査は最初の URL にしか効かないため、リダイレクト追跡は常に禁止する（N1）。
 */
export type FetchInit = RequestInit & { maxRedirections?: number };

export type FetchLike = (url: string, init?: FetchInit) => Promise<Response>;

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export type LlmConfig = { baseUrl: string; model: string };

const SAMPLING = { temperature: 0.7 };

/** リダイレクトはローカルの OpenAI 互換 API に不要で、外部送信の経路になるため追跡しない。 */
const NO_REDIRECT = { maxRedirections: 0 } as const;

export async function streamChat(
  fetchFn: FetchLike,
  config: LlmConfig,
  messages: ChatMessage[],
  opts: { signal?: AbortSignal; onChunk?: (acc: string) => void } = {},
): Promise<string> {
  const res = await fetchFn(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: config.model,
      messages,
      stream: true,
      temperature: SAMPLING.temperature,
    }),
    signal: opts.signal,
    ...NO_REDIRECT,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  let acc = '';
  let received = false;
  const reader = res
    .body!.pipeThrough(new TextDecoderStream())
    .pipeThrough(sseEvents())
    .getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    const delta = extractDelta(value);
    if (!delta) continue;
    if (delta.kind === 'error') {
      throw new Error(`モデルが生成中にエラーを返しました: ${delta.message}`);
    }
    received = true;
    acc += delta.content;
    opts.onChunk?.(acc);
  }
  if (!received) {
    throw new Error(
      'モデルから校正案が返りませんでした。入力が長すぎるか、モデルが応答できない状態の可能性があります。',
    );
  }
  return acc;
}

export async function listModels(fetchFn: FetchLike, baseUrl: string): Promise<string[]> {
  const res = await fetchFn(`${baseUrl}/models`, { ...NO_REDIRECT });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = (await res.json()) as { data?: { id: string }[] };
  return (json.data ?? []).map((m) => m.id);
}
