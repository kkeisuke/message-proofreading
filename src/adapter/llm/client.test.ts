import { describe, expect, it } from 'vitest';
import { LLMError } from '../../api/llmError';
import { listModels, streamChat, type FetchInit, type IFetch } from './client';

const sseResponse = (events: string[]): Response =>
  new Response(events.map((e) => `data: ${e}\n\n`).join(''), { status: 200 });

const deltaEvent = (content: string) => JSON.stringify({ choices: [{ delta: { content } }] });

type Call = { url: string; init?: FetchInit };

const recorder = (respond: () => Response) => {
  const calls: Call[] = [];
  const fetchFn: IFetch = async (url, init) => {
    calls.push({ url, init });
    return respond();
  };
  return { calls, fetchFn };
};

describe('streamChat', () => {
  it('delta を連結して全文を返し、onChunk に累積を渡す', async () => {
    const fetchFn: IFetch = async () =>
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
    const { url, init } = calls[0];
    expect(url).toBe('http://localhost:12434/engines/v1/chat/completions');
    expect(init?.method).toBe('POST');
    expect(init?.headers).toEqual({ 'Content-Type': 'application/json' });
    expect(init?.signal).toBe(ac.signal);
    expect(init?.maxRedirections).toBe(0);
    expect(JSON.parse(init?.body as string)).toEqual({
      model: 'gemma',
      messages,
      stream: true,
      temperature: 0.7,
    });
  });

  it('HTTP 404 は例外にする', async () => {
    const fetchFn: IFetch = async () => new Response('ng', { status: 404 });
    await expect(streamChat(fetchFn, { baseUrl: 'http://x', model: 'm' }, [])).rejects.toThrow(
      '404',
    );
  });

  it('HTTP 500 は例外にする', async () => {
    const fetchFn: IFetch = async () => new Response('ng', { status: 500 });
    await expect(streamChat(fetchFn, { baseUrl: 'http://x', model: 'm' }, [])).rejects.toThrow(
      '500',
    );
  });

  it('ストリーム内のエラーイベントは例外にする', async () => {
    const fetchFn: IFetch = async () =>
      sseResponse([JSON.stringify({ error: { message: 'context length exceeded' } })]);
    await expect(streamChat(fetchFn, { baseUrl: 'http://x', model: 'm' }, [])).rejects.toThrow(
      'context length exceeded',
    );
  });

  it('delta が一度も来ない応答は例外にする', async () => {
    const fetchFn: IFetch = async () => sseResponse(['[DONE]']);
    await expect(streamChat(fetchFn, { baseUrl: 'http://x', model: 'm' }, [])).rejects.toThrow(
      '校正案が返りませんでした',
    );
  });

  it('接続不能なら unreachable、それ以外は other/model-not-found として種別を持つ', async () => {
    const catchErr = (fn: IFetch) =>
      streamChat(fn, { baseUrl: 'http://x', model: 'm' }, []).catch((e: unknown) => e);

    const networkFail: IFetch = async () => {
      throw new TypeError('Failed to fetch');
    };
    const notFound: IFetch = async () => new Response('ng', { status: 404 });
    const serverError: IFetch = async () => new Response('ng', { status: 500 });
    const streamError: IFetch = async () =>
      sseResponse([JSON.stringify({ error: { message: 'context length exceeded' } })]);
    const emptyResponse: IFetch = async () => sseResponse(['[DONE]']);

    const [unreachable, modelNotFound, other1, other2, other3] = await Promise.all([
      catchErr(networkFail),
      catchErr(notFound),
      catchErr(serverError),
      catchErr(streamError),
      catchErr(emptyResponse),
    ]);

    expect(unreachable).toBeInstanceOf(LLMError);
    if (unreachable instanceof LLMError) expect(unreachable.kind).toBe('unreachable');

    expect(modelNotFound).toBeInstanceOf(LLMError);
    if (modelNotFound instanceof LLMError) expect(modelNotFound.kind).toBe('model-not-found');

    for (const other of [other1, other2, other3]) {
      expect(other).toBeInstanceOf(LLMError);
      if (other instanceof LLMError) expect(other.kind).toBe('other');
    }
  });
});

describe('listModels', () => {
  it('モデル ID の一覧を返す', async () => {
    const fetchFn: IFetch = async () =>
      new Response(JSON.stringify({ data: [{ id: 'a' }, { id: 'b' }] }), { status: 200 });
    expect(await listModels(fetchFn, 'http://x')).toEqual(['a', 'b']);
  });

  it('URL を組み立て、リダイレクトを禁止する', async () => {
    const { calls, fetchFn } = recorder(
      () => new Response(JSON.stringify({ data: [] }), { status: 200 }),
    );
    await listModels(fetchFn, 'http://localhost:11434/v1');
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe('http://localhost:11434/v1/models');
    expect(calls[0].init?.maxRedirections).toBe(0);
  });

  it('接続不能なら unreachable として種別を持つ', async () => {
    const fetchFn: IFetch = async () => {
      throw new TypeError('Failed to fetch');
    };
    const err = await listModels(fetchFn, 'http://x').catch((e: unknown) => e);
    expect(err).toBeInstanceOf(LLMError);
    if (err instanceof LLMError) expect(err.kind).toBe('unreachable');
  });

  it('HTTP 404 は model-not-found として種別を持つ', async () => {
    const fetchFn: IFetch = async () => new Response('ng', { status: 404 });
    const err = await listModels(fetchFn, 'http://x').catch((e: unknown) => e);
    expect(err).toBeInstanceOf(LLMError);
    if (err instanceof LLMError) expect(err.kind).toBe('model-not-found');
  });
});
