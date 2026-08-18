export function sseEvents(): TransformStream<string, string> {
  let buffer = '';
  return new TransformStream({
    transform(chunk, controller) {
      buffer += chunk;
      const events = buffer.split(/\r\n\r\n|\n\n|\r\r/);
      buffer = events.pop() ?? '';
      for (const event of events) controller.enqueue(event);
    },
    flush(controller) {
      if (buffer.trim()) controller.enqueue(buffer);
    },
  });
}

/** SSE イベント1件から取り出した内容。ストリーム内エラーは error として返す。 */
export type SseDelta = { kind: 'content'; content: string } | { kind: 'error'; message: string };

export function extractDelta(event: string): SseDelta | null {
  for (const line of event.split(/\r\n|\n|\r/)) {
    if (!line.startsWith('data:')) continue;
    const data = line.slice(5).trim();
    if (!data || data === '[DONE]') continue;

    let parsed: unknown;
    try {
      parsed = JSON.parse(data);
    } catch {
      return null;
    }

    const error = (parsed as { error?: unknown }).error;
    if (error !== undefined && error !== null) {
      return { kind: 'error', message: errorMessage(error) };
    }

    const content = (parsed as { choices?: { delta?: { content?: string } }[] }).choices?.[0]?.delta
      ?.content;
    return content ? { kind: 'content', content } : null;
  }
  return null;
}

function errorMessage(error: unknown): string {
  if (typeof error === 'string') return error;
  const message = (error as { message?: unknown }).message;
  if (typeof message === 'string' && message) return message;
  return JSON.stringify(error);
}
