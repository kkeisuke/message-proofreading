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

/**
 * fetch を実行し、通信そのものの失敗を `LLMError('unreachable')` に変換する。
 *
 * ランタイムが停止しているときの失敗はここに現れる。素の `TypeError` のままだと
 * 到達できなかったのか到達後に失敗したのかを呼び出し側で見分けられない。
 * HTTP のステータスは検査しないため、4xx/5xx はそのまま返る。
 *
 * @param fetchFn 実行する fetch。実行時は tauri-plugin-http の実装が入る
 * @param url リクエスト先。scope 検査を受ける最初の URL でもある
 * @param init リクエストの内容。`NO_REDIRECT` を含めて渡すこと
 * @returns 到達できたときのレスポンス。成否は呼び出し側が `res.ok` で判定する
 * @throws {LLMError} 到達できなかったときは kind `unreachable`
 * @throws 中断されたときは fetch が投げた例外をそのまま
 */
async function fetchOrThrow(fetchFn: IFetch, url: string, init: FetchInit): Promise<Response> {
  try {
    return await fetchFn(url, init);
  } catch (e) {
    // 利用者が中断した場合は到達できなかったわけではないため、種別を付けずにそのまま伝える。
    if (init.signal?.aborted) {
      throw e;
    }
    throw new LLMError('unreachable', `${url} に接続できませんでした: ${causeMessage(e)}`);
  }
}

/**
 * 捕捉した値から原因の文言を取り出す。
 *
 * catch が受け取る値は `unknown` で、Error とは限らない。
 *
 * @param e catch 節が受け取った値
 * @returns エラーメッセージの文字列。必ず何かを返す
 */
function causeMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

/**
 * 到達はできたが失敗した HTTP レスポンスを、種別付きの `LLMError` に変換する。
 *
 * 404 だけはモデル名の誤りとして切り出す。利用者に示す対処が
 * 「ランタイムを起動する」ではなく「設定でモデル名を確認する」になるため。
 *
 * @param status レスポンスの HTTP ステータス
 * @returns 404 なら kind `model-not-found`、それ以外は `other` の LLMError
 */
function httpErrorOf(status: number): LLMError {
  if (status === 404) {
    return new LLMError(
      'model-not-found',
      `モデルが見つかりません（HTTP ${status}）。モデル名を確認してください。`,
    );
  }
  return new LLMError('other', `HTTP ${status}`);
}

/**
 * OpenAI 互換 API の `/chat/completions` に投げ、生成テキストを逐次受け取る。
 *
 * レスポンスは `TextDecoderStream` → Server-Sent Events の分割 → JSON 解釈の順に
 * 通し、断片が届くたびに累積した全文を `opts.onChunk` へ渡す。
 *
 * 失敗を無音で終わらせないため、次の2つも例外にする。ストリーム内エラーは
 * HTTP 200 で流れてくるので、拾わないと画面が空欄のまま終わる。
 *
 * - ストリームの途中で error イベントが流れてきた場合
 * - 断片が一度も届かないまま終わった場合
 *
 * @param fetchFn 実行する fetch。実行時は tauri-plugin-http の実装が入る
 * @param config 接続先の baseUrl と使用するモデル名
 * @param messages 送信するメッセージ列。`domain/prompts.ts` が組み立てる
 * @param opts 中断用の signal と、逐次表示用の onChunk
 * @returns 生成された全文。整形はしないため、呼び出し側が `cleanGeneratedText` に通す
 * @throws {LLMError} 接続不能なら `unreachable`、モデル未検出なら `model-not-found`、
 *   その他の HTTP エラー・ストリーム内エラー・応答なしは `other`
 * @throws {DOMException} `opts.signal` で中断されたときの AbortError
 */
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
  if (!res.ok) {
    throw httpErrorOf(res.status);
  }

  let acc = '';
  let received = false;
  const reader = res
    .body!.pipeThrough(new TextDecoderStream())
    .pipeThrough(splitServerSentEvents())
    .getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    const delta = readChatChunk(value);
    if (!delta) {
      continue;
    }
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

/**
 * OpenAI 互換 API の `/models` から、導入済みモデルの ID 一覧を取得する（F7）。
 *
 * 設定画面のモデル選択に使うほか、到達可否の確認そのものにも使う。
 *
 * @param fetchFn 実行する fetch。実行時は tauri-plugin-http の実装が入る
 * @param baseUrl 接続先の baseUrl
 * @returns モデル ID の配列。data が欠けた応答では空配列
 * @throws {LLMError} 接続不能なら `unreachable`、それ以外は HTTP ステータスに応じた種別
 */
export async function fetchModels(fetchFn: IFetch, baseUrl: string): Promise<string[]> {
  const res = await fetchOrThrow(fetchFn, `${baseUrl}/models`, { ...NO_REDIRECT });
  if (!res.ok) {
    throw httpErrorOf(res.status);
  }
  const json = (await res.json()) as { data?: { id: string }[] };
  return (json.data ?? []).map((m) => m.id);
}
