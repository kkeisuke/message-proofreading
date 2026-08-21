import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '../../api/connection';
import { createSettingsStore } from './settings';

const fakeStorage = () => {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
  };
};

describe('settings storage', () => {
  it('未保存なら既定値を返す', () => {
    expect(createSettingsStore(fakeStorage()).load()).toEqual(DEFAULT_SETTINGS);
  });

  it('保存した値を読み戻せる', () => {
    const store = createSettingsStore(fakeStorage());
    store.save({ llmRuntimeId: 'ollama', model: 'gemma4:e4b' });
    expect(store.load()).toEqual({ llmRuntimeId: 'ollama', model: 'gemma4:e4b' });
  });

  it('壊れた JSON は既定値にフォールバックする', () => {
    const storage = fakeStorage();
    storage.setItem('settings', '{broken');
    expect(createSettingsStore(storage).load()).toEqual(DEFAULT_SETTINGS);
  });
});
