import { expect, test } from 'vitest';
import { LLMError } from '../api/llmError';
import { isLLMReachable } from './useLLMRuntimeStatus';

test('到達できなかった失敗は未接続と判定する', () => {
  expect(isLLMReachable(new LLMError('unreachable', '接続できませんでした'))).toBe(false);
});

test('到達したうえでの失敗は接続できている証拠として扱う', () => {
  expect(isLLMReachable(new LLMError('model-not-found', 'モデルが見つかりません'))).toBe(true);
  expect(isLLMReachable(new LLMError('other', 'HTTP 500'))).toBe(true);
});

test('種別の分からない失敗は未接続と判定する', () => {
  expect(isLLMReachable(new Error('unknown'))).toBe(false);
  expect(isLLMReachable('文字列')).toBe(false);
});
