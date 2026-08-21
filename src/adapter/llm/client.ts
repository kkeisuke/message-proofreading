import type { ChatMessage, ChatStreamOptions } from '../../api/chat';
import { LLMError } from '../../api/llmError';
import { readChatChunk, splitServerSentEvents } from './chatStream';

/** tauri-plugin-http の fetch は RequestInit に加えて maxRedirections を受け取る。 */
export type FetchInit = RequestInit & { maxRedirections?: number };

export type IFetch = (url: string, init?: FetchInit) => Promise<Response>;

export type ChatConfig = { baseUrl: string; model: string };

/** 事前検証で較正した値。案の多様性（F3）を担保する。 */
const SAMPLING = { temperature: 0.7 };

/**
 * リダイレクトを追跡しない（N1）。
 * capability の scope 検査は最初の URL にしか効かず、リダイレクト先は再照合されない。
 * 追跡を許すと、localhost を先に掴んだプロセスの 308 応答で本文が外部へ出る。
 */
const NO_REDIRECT = { maxRedirections: 0 } as const;

/** fetch 自体の失敗（接続不能）を LLMError('unreachable') に変換する。 */
async function fetchOrThrow(fetchFn: IFetch, url: string, init: FetchInit): Promise<Response> {
  try {
    return await fetchFn(url, init);
  } catch (e) {
    throw new LLMError('unreachable', `${url} に接続できませんでした: ${causeMessage(e)}`);
  }
}

function causeMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

/** 到達はできたが失敗した HTTP レスポンスを、種別付きの LLMError に変換する。 */
function httpErrorOf(status: number): LLMError {
  if (status === 404) {
    return new LLMError(
      'model-not-found',
      `モデルが見つかりません（HTTP ${status}）。モデル名を確認してください。`,
    );
  }
  return new LLMError('other', `HTTP ${status}`);
}

export async function streamChat(
  fetchFn: IFetch,
  config: ChatConfig,
  messages: ChatMessage[],
  opts: ChatStreamOptions = {},
): Promise<string> {
  const res = await fetchOrThrow(fetchFn, `${config.baseUrl}/chat/completions`, {
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
  if (!res.ok) throw httpErrorOf(res.status);

  let acc = '';
  let received = false;
  const reader = res
    .body!.pipeThrough(new TextDecoderStream())
    .pipeThrough(splitServerSentEvents())
    .getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    const delta = readChatChunk(value);
    if (!delta) continue;
    if (delta.kind === 'error') {
      throw new LLMError('other', `モデルが生成中にエラーを返しました: ${delta.message}`);
    }
    received = true;
    acc += delta.content;
    opts.onChunk?.(acc);
  }
  if (!received) {
    throw new LLMError(
      'other',
      'モデルから校正案が返りませんでした。入力が長すぎるか、モデルが応答できない状態の可能性があります。',
    );
  }
  return acc;
}

export async function listModels(fetchFn: IFetch, baseUrl: string): Promise<string[]> {
  const res = await fetchOrThrow(fetchFn, `${baseUrl}/models`, { ...NO_REDIRECT });
  if (!res.ok) throw httpErrorOf(res.status);
  const json = (await res.json()) as { data?: { id: string }[] };
  return (json.data ?? []).map((m) => m.id);
}
