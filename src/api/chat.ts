/**
 * LLM とやり取りする 1 メッセージの形。
 *
 * feature 側の `domain/prompts.ts` がプロンプトとして組み立て、
 * adapter 側の `llm/client.ts` が OpenAI 互換 API へのリクエストとして送信する。
 * api/ は LLM API との契約を定義する側で、I/O を持たない。
 * 実際に通信するのは adapter/llm で、この型は adapter と feature の双方から参照される。
 */
export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };
