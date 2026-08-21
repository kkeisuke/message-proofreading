import { describe, expect, it } from 'vitest';
import type { GenerateFn } from './proofread';
import { proofread } from './proofread';

describe('proofread（検証なし版）', () => {
  it('生成結果を整形して返す', async () => {
    const generate: GenerateFn = async () => ' 「校正済みの本文です。」 ';
    const result = await proofread('入力', 'business', generate);
    expect(result.proofreadText).toBe('校正済みの本文です。');
  });

  it('シーンと入力からメッセージ列を組み立てて generate に渡す', async () => {
    let received: string | undefined;
    const generate: GenerateFn = async (messages) => {
      received = messages.at(-1)!.content;
      return 'x';
    };
    await proofread('こんにちは', 'casual', generate);
    expect(received).toContain('---\nこんにちは\n---');
  });
});
