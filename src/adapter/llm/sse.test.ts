import { describe, expect, it } from 'vitest';
import { extractDelta, sseEvents } from './sse';

async function collect(chunks: string[]): Promise<string[]> {
  const out: string[] = [];
  const stream = new ReadableStream<string>({
    start(c) {
      for (const chunk of chunks) c.enqueue(chunk);
      c.close();
    },
  }).pipeThrough(sseEvents());
  const reader = stream.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    out.push(value);
  }
  return out;
}

describe('sseEvents', () => {
  it('空行区切りでイベントに分割する', async () => {
    expect(await collect(['data: a\n\ndata: b\n\n'])).toEqual(['data: a', 'data: b']);
  });

  it('イベント途中で切れたチャンクを結合する', async () => {
    expect(await collect(['data: he', 'llo\n\nda', 'ta: world\n\n'])).toEqual([
      'data: hello',
      'data: world',
    ]);
  });

  it('末尾に改行がなくても flush で出す', async () => {
    expect(await collect(['data: tail'])).toEqual(['data: tail']);
  });

  it('CRLF 区切りでも分割する', async () => {
    expect(await collect(['data: a\r\n\r\ndata: b\r\n\r\n'])).toEqual(['data: a', 'data: b']);
  });

  it('CRLF が区切りの途中で切れても結合する', async () => {
    expect(await collect(['data: a\r\n\r', '\ndata: b\r\n\r\n'])).toEqual(['data: a', 'data: b']);
  });

  it('CR のみの区切りでも分割する', async () => {
    expect(await collect(['data: a\r\rdata: b\r\r'])).toEqual(['data: a', 'data: b']);
  });
});

describe('extractDelta', () => {
  it('delta.content を取り出す', () => {
    const event = `data: ${JSON.stringify({ choices: [{ delta: { content: 'こん' } }] })}`;
    expect(extractDelta(event)).toEqual({ kind: 'content', content: 'こん' });
  });

  it('CRLF 改行のイベントでも delta.content を取り出す', () => {
    const event = `event: message\r\ndata: ${JSON.stringify({
      choices: [{ delta: { content: 'こん' } }],
    })}\r\n`;
    expect(extractDelta(event)).toEqual({ kind: 'content', content: 'こん' });
  });

  it('[DONE] と壊れた JSON は null', () => {
    expect(extractDelta('data: [DONE]')).toBeNull();
    expect(extractDelta('data: {broken')).toBeNull();
  });

  it('error フィールドを持つイベントはエラーとして返す', () => {
    const event = `data: ${JSON.stringify({ error: { message: 'context length exceeded' } })}`;
    expect(extractDelta(event)).toEqual({ kind: 'error', message: 'context length exceeded' });
  });

  it('error が文字列でもエラーとして返す', () => {
    expect(extractDelta(`data: ${JSON.stringify({ error: 'busy' })}`)).toEqual({
      kind: 'error',
      message: 'busy',
    });
  });
});
