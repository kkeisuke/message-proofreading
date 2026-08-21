/**
 * デコード済みのテキストストリームを、Server-Sent Events の1イベントごとに切り出す。
 *
 * 区切りは空行で、CRLF・LF・CR のいずれにも対応する。チャンクの境界はイベントの
 * 途中に落ちるため、末尾の未完成部分は buffer に残して次のチャンクと連結する。
 * ストリームが末尾の空行なしで終わったときは flush で残りを1イベントとして流す。
 *
 * @returns 入力を文字列チャンク、出力を1イベント分の文字列とする TransformStream
 */
export function splitServerSentEvents(): TransformStream<string, string> {
  let buffer = '';
  return new TransformStream({
    transform(chunk, controller) {
      buffer += chunk;
      const events = buffer.split(/\r\n\r\n|\n\n|\r\r/);
      buffer = events.pop() ?? '';
      for (const event of events) {
        controller.enqueue(event);
      }
    },
    flush(controller) {
      if (buffer.trim()) {
        controller.enqueue(buffer);
      }
    },
  });
}

export type ChatChunk = { kind: 'content'; content: string } | { kind: 'error'; message: string };

/**
 * Server-Sent Events のイベント1件を解釈し、生成された断片かストリーム内エラーを取り出す。
 *
 * 1イベントに data 行は1つという前提に立ち、最初に解釈できた行で確定する。
 * ストリーム内エラーは HTTP 200 で流れてくるため、ここで拾わないと無音で終わる。
 *
 * @param event `splitServerSentEvents` が切り出したイベント1件分の文字列
 * @returns 生成断片、ストリーム内エラー、または取り出すものがなければ null
 *   （data 行なし・`[DONE]`・壊れた JSON・content が空文字のいずれか）
 */
export function readChatChunk(event: string): ChatChunk | null {
  for (const line of event.split(/\r\n|\n|\r/)) {
    if (!line.startsWith('data:')) {
      continue;
    }
    const data = line.slice(5).trim();
    if (!data || data === '[DONE]') {
      continue;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(data);
    } catch {
      return null;
    }

    const error = (parsed as { error?: unknown }).error;
    if (error && (typeof error === 'object' || typeof error === 'string')) {
      return { kind: 'error', message: errorMessage(error) };
    }

    const content = (parsed as { choices?: { delta?: { content?: string } }[] }).choices?.[0]?.delta
      ?.content;
    return content ? { kind: 'content', content } : null;
  }
  return null;
}

/**
 * エラーオブジェクトから利用者に見せる文言を取り出す。
 *
 * error の形はランタイムごとに違い、文字列のことも `{ message }` のこともある。
 * どちらでもなければ JSON 文字列にして、原因の手がかりを落とさない。
 *
 * @param error Server-Sent Events の data に含まれていた error フィールドの値
 * @returns 表示に使う文字列。必ず何かを返す
 */
function errorMessage(error: unknown): string {
  if (typeof error === 'string') {
    return error;
  }
  const message = (error as { message?: unknown }).message;
  if (typeof message === 'string' && message) {
    return message;
  }
  return JSON.stringify(error);
}
