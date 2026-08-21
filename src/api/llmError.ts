/**
 * adapter/llm が投げる例外の種別。
 *
 * - unreachable: 接続先に到達できない（ネットワーク層の失敗）
 * - model-not-found: 到達はできたが、指定したモデルが存在しない（HTTP 404）
 * - other: 到達はできたが、生成そのものが失敗した（コンテキスト長超過・応答なし・その他の HTTP エラーなど）
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
