import { describe, expect, it } from 'vitest';
import { buildPrompt } from './prompts';

describe('buildPrompt', () => {
  it('system + few-shot 対 + 実入力の並びになる', () => {
    const messages = buildPrompt('テスト入力', 'business');
    expect(messages[0].role).toBe('system');
    const rest = messages.slice(1);
    expect(rest.length % 2).toBe(1);
    for (let i = 0; i < rest.length - 1; i += 2) {
      expect(rest[i].role).toBe('user');
      expect(rest[i + 1].role).toBe('assistant');
    }
    expect(rest.at(-1)!.role).toBe('user');
  });

  it('実入力は区切り線のフレームで包まれる', () => {
    const last = buildPrompt('テスト入力', 'business').at(-1)!;
    expect(last.content).toContain('---\nテスト入力\n---');
  });

  it('利用シーンで system プロンプトが変わる', () => {
    expect(buildPrompt('x', 'business')[0].content).not.toBe(buildPrompt('x', 'casual')[0].content);
  });
});
