export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

/** 生成の逐次受信と中断を扱うオプション。domain と adapter の双方が同じ形を使う。 */
export type ChatStreamOptions = {
  signal?: AbortSignal;
  onChunk?: (acc: string) => void;
};
