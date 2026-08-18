const BRACKETS = [
  ['「', '」'],
  ['『', '』'],
] as const;

/** 先頭の括弧が末尾で閉じる（＝文全体がその1組で囲まれている）かを判定する。 */
const wrapsWhole = (text: string, open: string, close: string): boolean => {
  let depth = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === open) depth++;
    else if (char === close) {
      depth--;
      if (depth === 0) return i === text.length - 1;
    }
  }
  return false;
};

/** 全体が対応する引用符で囲まれている場合だけ剥がす。片側だけの一致では剥がさない。 */
const unquote = (text: string): string => {
  for (const [open, close] of BRACKETS) {
    if (text.startsWith(open) && wrapsWhole(text, open, close)) return text.slice(1, -1);
  }
  if (
    text.length >= 2 &&
    text.startsWith('"') &&
    text.endsWith('"') &&
    !text.slice(1, -1).includes('"')
  ) {
    return text.slice(1, -1);
  }
  return text;
};

export const cleanup = (raw: string): string =>
  unquote(
    raw
      .replace(/<think(ing)?>[\s\S]*?<\/think(ing)?>/gi, '')
      .trim()
      .replace(/^---\s*/, '')
      .replace(/\s*---$/, '')
      .trim(),
  ).trim();
