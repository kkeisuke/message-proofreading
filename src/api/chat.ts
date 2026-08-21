/**
 * LLM とやり取りする 1 メッセージの形。
 *
 * feature 側の `domain/prompts.ts` がプロンプトとして組み立て、
 * adapter 側の `llm/client.ts` が OpenAI 互換 API へのリクエストとして送信する。
 * api/ は LLM API との契約を定義する側で、I/O を持たない。
 * 実際に通信するのは adapter/llm で、この型は adapter と feature の双方から参照される。
 */
export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

/** 生成の逐次受信と中断を扱うオプション。domain と adapter の双方が同じ形を使う。 */
export type ChatStreamOptions = {
  signal?: AbortSignal;
  onChunk?: (acc: string) => void;
};
