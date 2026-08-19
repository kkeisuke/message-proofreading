import { expect, test, vi } from 'vitest';

/**
 * ストアはモジュールスコープに状態を持つため、テストごとに読み込み直して独立させる。
 * useSyncExternalStore を使う hook 本体は DOM が要るためここでは扱わない。
 */
const load = async () => {
  vi.resetModules();
  return import('./useConnection');
};

test('報告前のスナップショットは null', async () => {
  const { getConnectionSnapshot } = await load();
  expect(getConnectionSnapshot()).toBe(null);
});

test('報告した値がスナップショットに反映される', async () => {
  const { getConnectionSnapshot, reportConnection } = await load();
  reportConnection(true);
  expect(getConnectionSnapshot()).toBe(true);
  reportConnection(false);
  expect(getConnectionSnapshot()).toBe(false);
});

test('値が変わったときだけ購読者に通知する', async () => {
  const { reportConnection, subscribeConnection } = await load();
  let calls = 0;
  subscribeConnection(() => {
    calls += 1;
  });

  reportConnection(true);
  expect(calls).toBe(1);

  reportConnection(true);
  expect(calls).toBe(1);

  reportConnection(false);
  expect(calls).toBe(2);
});

test('購読者は全員が通知を受ける', async () => {
  const { reportConnection, subscribeConnection } = await load();
  const seen: string[] = [];
  subscribeConnection(() => seen.push('a'));
  subscribeConnection(() => seen.push('b'));

  reportConnection(true);

  expect(seen).toEqual(['a', 'b']);
});

test('購読解除した後は通知されない', async () => {
  const { reportConnection, subscribeConnection } = await load();
  let calls = 0;
  const unsubscribe = subscribeConnection(() => {
    calls += 1;
  });

  unsubscribe();
  reportConnection(true);

  expect(calls).toBe(0);
});
