import { describe, expect, it } from 'vitest';
import { buildReplyPrompt } from './prompts';

describe('buildReplyPrompt', () => {
  it('system + few-shot 対 + 実入力の並びになる', () => {
    const messages = buildReplyPrompt('相手の文', '要点', 'business');
    expect(messages[0].role).toBe('system');
    const rest = messages.slice(1);
    expect(rest.length % 2).toBe(1);
    for (let i = 0; i < rest.length - 1; i += 2) {
      expect(rest[i].role).toBe('user');
      expect(rest[i + 1].role).toBe('assistant');
    }
    expect(rest.at(-1)!.role).toBe('user');
  });

  it('相手のメッセージと伝えたいことが、それぞれ別のフレームで包まれる', () => {
    const last = buildReplyPrompt('相手の文', '要点', 'business').at(-1)!;
    expect(last.content).toContain('[相手のメッセージ]\n---\n相手の文\n---');
    expect(last.content).toContain('[伝えたいこと]\n---\n要点\n---');
  });

  it('相手のメッセージのフレームが先に来る', () => {
    const last = buildReplyPrompt('相手の文', '要点', 'business').at(-1)!;
    expect(last.content.indexOf('[相手のメッセージ]')).toBeLessThan(
      last.content.indexOf('[伝えたいこと]'),
    );
  });

  it('利用シーンで system プロンプトが変わる', () => {
    expect(buildReplyPrompt('x', 'y', 'business')[0].content).not.toBe(
      buildReplyPrompt('x', 'y', 'casual')[0].content,
    );
  });
});
