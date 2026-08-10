export const cleanup = (raw: string): string =>
  raw
    .replace(/<think(ing)?>[\s\S]*?<\/think(ing)?>/gi, '')
    .trim()
    .replace(/^---\s*/, '')
    .replace(/\s*---$/, '')
    .replace(/^["「『]|["」』]$/g, '')
    .trim();
