import { extractDelta, sseEvents } from './sse';

export type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export type LlmConfig = { baseUrl: string; model: string };

const SAMPLING = { temperature: 0.7 };

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
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  let acc = '';
  const reader = res
    .body!.pipeThrough(new TextDecoderStream())
    .pipeThrough(sseEvents())
    .getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    const delta = extractDelta(value);
    if (delta) {
      acc += delta;
      opts.onChunk?.(acc);
    }
  }
  return acc;
}

export async function listModels(fetchFn: FetchLike, baseUrl: string): Promise<string[]> {
  const res = await fetchFn(`${baseUrl}/models`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = (await res.json()) as { data?: { id: string }[] };
  return (json.data ?? []).map((m) => m.id);
}
