import { expect, test } from 'vitest';
import { isKeyboardActivation, isPointerActivation } from './buttonActivation';

test('主ボタンによる操作だけを、押されたものとして扱う', () => {
  expect(isPointerActivation(false, 0)).toBe(true);
  expect(isPointerActivation(false, 1)).toBe(false);
  expect(isPointerActivation(false, 2)).toBe(false);
});

test('detail が 0 の click はキーボード由来として扱う', () => {
  expect(isKeyboardActivation(false, 0)).toBe(true);
});

test('ポインタ由来の click はキーボード由来として扱わない', () => {
  expect(isKeyboardActivation(false, 1)).toBe(false);
  expect(isKeyboardActivation(false, 2)).toBe(false);
});

test('無効なボタンは、ポインタでもキーボードでも押されたものとして扱わない', () => {
  expect(isPointerActivation(true, 0)).toBe(false);
  expect(isKeyboardActivation(true, 0)).toBe(false);
});
