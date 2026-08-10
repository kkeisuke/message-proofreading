import { describe, expect, it } from 'vitest';
import { listModels, streamChat, type FetchLike } from './client';

const sseResponse = (events: string[]): Response =>
  new Response(events.map((e) => `data: ${e}\n\n`).join(''), { status: 200 });

const deltaEvent = (content: string) => JSON.stringify({ choices: [{ delta: { content } }] });

describe('streamChat', () => {
  it('delta を連結して全文を返し、onChunk に累積を渡す', async () => {
    const fetchFn: FetchLike = async () =>
      sseResponse([deltaEvent('こん'), deltaEvent('にちは'), '[DONE]']);
    const acc: string[] = [];
    const result = await streamChat(
      fetchFn,
      { baseUrl: 'http://localhost:12434/engines/v1', model: 'm' },
      [{ role: 'user', content: 'x' }],
      { onChunk: (a) => acc.push(a) },
    );
    expect(result).toBe('こんにちは');
    expect(acc).toEqual(['こん', 'こんにちは']);
  });

  it('HTTP エラーは例外にする', async () => {
    const fetchFn: FetchLike = async () => new Response('ng', { status: 500 });
    await expect(streamChat(fetchFn, { baseUrl: 'http://x', model: 'm' }, [])).rejects.toThrow(
      '500',
    );
  });
});

describe('listModels', () => {
  it('モデル ID の一覧を返す', async () => {
    const fetchFn: FetchLike = async () =>
      new Response(JSON.stringify({ data: [{ id: 'a' }, { id: 'b' }] }), { status: 200 });
    expect(await listModels(fetchFn, 'http://x')).toEqual(['a', 'b']);
  });
});
