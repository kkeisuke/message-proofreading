/**
 * adapter/llm が投げる例外の種別。
 *
 * - unreachable: 接続先に到達できない（ネットワーク層の失敗）
 * - model-not-found: 到達はできたが、指定したモデルが存在しない（HTTP 404）
 * - other: 到達はできたが、生成そのものが失敗した（コンテキスト長超過・応答なし・その他の HTTP エラーなど）
 *
 * feature 側はこの種別で「接続できません」の表示と、それ以外の失敗の表示を分ける。
 * api/ は LLM API との契約を定義する側で、I/O を持たない。
 * 実際に通信するのは adapter/llm で、この型は adapter と feature の双方から参照される。
 */
export type LLMErrorKind = 'unreachable' | 'model-not-found' | 'other';

export class LLMError extends Error {
  readonly kind: LLMErrorKind;

  constructor(kind: LLMErrorKind, message: string) {
    super(message);
    this.name = 'LLMError';
    this.kind = kind;
  }
}
