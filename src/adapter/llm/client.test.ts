import { describe, expect, it } from 'vitest';
import { listModels, streamChat, type FetchInit, type FetchLike } from './client';

const sseResponse = (events: string[]): Response =>
  new Response(events.map((e) => `data: ${e}\n\n`).join(''), { status: 200 });

const deltaEvent = (content: string) => JSON.stringify({ choices: [{ delta: { content } }] });

type Call = { url: string; init?: FetchInit };

const recorder = (respond: () => Response) => {
  const calls: Call[] = [];
  const fetchFn: FetchLike = async (url, init) => {
    calls.push({ url, init });
    return respond();
  };
  return { calls, fetchFn };
};

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

  it('URL とリクエスト内容を組み立てて渡す', async () => {
    const { calls, fetchFn } = recorder(() => sseResponse([deltaEvent('あ'), '[DONE]']));
    const ac = new AbortController();
    const messages = [
      { role: 'system' as const, content: 'sys' },
      { role: 'user' as const, content: 'usr' },
    ];
    await streamChat(
      fetchFn,
      { baseUrl: 'http://localhost:12434/engines/v1', model: 'gemma' },
      messages,
      { signal: ac.signal },
    );

    expect(calls).toHaveLength(1);
    const { url, init } = calls[0]!;
    expect(url).toBe('http://localhost:12434/engines/v1/chat/completions');
    expect(init?.method).toBe('POST');
    expect(init?.headers).toEqual({ 'Content-Type': 'application/json' });
    expect(init?.signal).toBe(ac.signal);
    expect(init?.maxRedirections).toBe(0);
    expect(JSON.parse(String(init?.body))).toEqual({
      model: 'gemma',
      messages,
      stream: true,
      temperature: 0.7,
    });
  });

  it('HTTP エラーは例外にする', async () => {
    const fetchFn: FetchLike = async () => new Response('ng', { status: 500 });
    await expect(streamChat(fetchFn, { baseUrl: 'http://x', model: 'm' }, [])).rejects.toThrow(
      '500',
    );
  });

  it('ストリーム内のエラーイベントは例外にする', async () => {
    const fetchFn: FetchLike = async () =>
      sseResponse([JSON.stringify({ error: { message: 'context length exceeded' } })]);
    await expect(streamChat(fetchFn, { baseUrl: 'http://x', model: 'm' }, [])).rejects.toThrow(
      'context length exceeded',
    );
  });

  it('delta が一度も来ない応答は例外にする', async () => {
    const fetchFn: FetchLike = async () => sseResponse(['[DONE]']);
    await expect(streamChat(fetchFn, { baseUrl: 'http://x', model: 'm' }, [])).rejects.toThrow(
      '校正案が返りませんでした',
    );
  });
});

describe('listModels', () => {
  it('モデル ID の一覧を返す', async () => {
    const fetchFn: FetchLike = async () =>
      new Response(JSON.stringify({ data: [{ id: 'a' }, { id: 'b' }] }), { status: 200 });
    expect(await listModels(fetchFn, 'http://x')).toEqual(['a', 'b']);
  });

  it('URL を組み立て、リダイレクトを禁止する', async () => {
    const { calls, fetchFn } = recorder(
      () => new Response(JSON.stringify({ data: [] }), { status: 200 }),
    );
    await listModels(fetchFn, 'http://localhost:11434/v1');
    expect(calls).toHaveLength(1);
    expect(calls[0]!.url).toBe('http://localhost:11434/v1/models');
    expect(calls[0]!.init?.maxRedirections).toBe(0);
  });
});
