import { describe, expect, it } from 'vitest';
import { cleanGeneratedText } from './cleanGeneratedText';

describe('cleanGeneratedText', () => {
  it('前後の空白と引用符を除く', () => {
    expect(cleanGeneratedText('  「本文です。」 ')).toBe('本文です。');
  });

  it('思考タグと区切り線の残骸を除く', () => {
    expect(cleanGeneratedText('<think>考え</think>\n--- 本文です。 ---')).toBe('本文です。');
  });

  it('通常の本文はそのまま', () => {
    expect(cleanGeneratedText('本文です。')).toBe('本文です。');
  });

  it('全体が囲まれているときだけ鉤括弧を剥がす', () => {
    expect(cleanGeneratedText('「全体が囲まれた文」')).toBe('全体が囲まれた文');
  });

  it('文頭の鉤括弧は残す', () => {
    expect(cleanGeneratedText('「至急」の件、了解です。')).toBe('「至急」の件、了解です。');
  });

  it('文末の鉤括弧は残す', () => {
    expect(cleanGeneratedText('了解です。詳細は「別紙」')).toBe('了解です。詳細は「別紙」');
  });

  it('全体を囲んでいない鉤括弧の対は残す', () => {
    expect(cleanGeneratedText('「A」と「B」')).toBe('「A」と「B」');
  });
});
