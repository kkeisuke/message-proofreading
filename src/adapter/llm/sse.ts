export function sseEvents(): TransformStream<string, string> {
  let buffer = '';
  return new TransformStream({
    transform(chunk, controller) {
      buffer += chunk;
      const events = buffer.split('\n\n');
      buffer = events.pop() ?? '';
      for (const event of events) controller.enqueue(event);
    },
    flush(controller) {
      if (buffer.trim()) controller.enqueue(buffer);
    },
  });
}

export function extractDelta(event: string): string | null {
  for (const line of event.split('\n')) {
    if (!line.startsWith('data:')) continue;
    const data = line.slice(5).trim();
    if (!data || data === '[DONE]') continue;
    try {
      const delta: unknown = JSON.parse(data);
      const content = (delta as { choices?: { delta?: { content?: string } }[] }).choices?.[0]
        ?.delta?.content;
      return content ?? null;
    } catch {
      return null;
    }
  }
  return null;
}
