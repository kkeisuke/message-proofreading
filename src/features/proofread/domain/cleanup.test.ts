import { describe, expect, it } from 'vitest';
import { cleanup } from './cleanup';

describe('cleanup', () => {
  it('前後の空白と引用符を除く', () => {
    expect(cleanup('  「本文です。」 ')).toBe('本文です。');
  });

  it('思考タグと区切り線の残骸を除く', () => {
    expect(cleanup('<think>考え</think>\n--- 本文です。 ---')).toBe('本文です。');
  });

  it('通常の本文はそのまま', () => {
    expect(cleanup('本文です。')).toBe('本文です。');
  });
});
