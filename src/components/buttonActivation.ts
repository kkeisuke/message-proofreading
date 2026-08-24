import type { MouseEvent, PointerEvent } from 'react';

/** 主ボタン（左クリック・タップ）による、有効なボタンへの操作か。 */
export function isPointerActivation(disabled: boolean, button: number): boolean {
  return !disabled && button === 0;
}

/**
 * キーボード（Enter・Space）による、有効なボタンへの操作か。
 * ポインタ由来の click は押した回数が detail に入るため 1 以上になる。
 */
export function isKeyboardActivation(disabled: boolean, detail: number): boolean {
  return !disabled && detail === 0;
}

/**
 * ボタンが押されたことを取りこぼさずに拾うイベントハンドラを組み立てる。
 *
 * WebKit は textarea からフォーカスが移るタップで pointerdown と pointerup を
 * 逆順に配送することがあり、その場合 click が合成されない。
 * onClick だけに任せると「校正する」が反応しないため、離しの側で拾う。
 *
 * ポインタ操作は pointerup で、キーボード操作は click で拾う。
 * 両者は detail で区別できるので、二重に発火しない。
 * 配送順が壊れていても動くよう、pointerdown の有無には依存させない。
 *
 * @param onActivate ボタンが押されたときに行う処理
 * @returns button 要素にそのまま展開できるイベントハンドラ
 */
export function getButtonActivationProps(onActivate: () => void) {
  return {
    // click と違い pointerup は無効なボタンにも配送されるため、ここで弾く。
    onPointerUp: (e: PointerEvent<HTMLButtonElement>) => {
      if (isPointerActivation(e.currentTarget.disabled, e.button)) {
        onActivate();
      }
    },
    onClick: (e: MouseEvent<HTMLButtonElement>) => {
      if (isKeyboardActivation(e.currentTarget.disabled, e.detail)) {
        onActivate();
      }
    },
  };
}
