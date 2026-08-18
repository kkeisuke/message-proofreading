/**
 * adapter/llm が投げる例外の種別。
 *
 * - unreachable: 接続先に到達できない（ネットワーク層の失敗）
 * - model-not-found: 到達はできたが、指定したモデルが存在しない（HTTP 404）
 * - other: 到達はできたが、生成そのものが失敗した（コンテキスト長超過・応答なし・その他の HTTP エラーなど）
 *
 * feature 側はこの種別で「接続できません」の表示と、それ以外の失敗の表示を分ける。
 * 型は adapter と feature の双方から参照されるため、どちらにも属さない共有 domain に置く。
 */
export type LlmErrorKind = 'unreachable' | 'model-not-found' | 'other';

export class LlmError extends Error {
  readonly kind: LlmErrorKind;

  constructor(kind: LlmErrorKind, message: string) {
    super(message);
    this.name = 'LlmError';
    this.kind = kind;
  }
}
