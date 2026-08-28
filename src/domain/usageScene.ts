/**
 * 送る相手・場に合わせて選ぶ文体。校正と返信の両方が使う。
 *
 * 文体の定義は docs/design.md §5.3 にある。
 */
export type UsageScene = 'business' | 'casual';

export const USAGE_SCENES: { id: UsageScene; label: string }[] = [
  { id: 'business', label: 'ビジネス' },
  { id: 'casual', label: 'カジュアル' },
];
