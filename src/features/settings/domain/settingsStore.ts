import type { Settings } from '../../../api/settings';

/** 保存の手段（localStorage 等）は adapter 側の関心で、feature はこの形だけを知る。 */
export type SettingsStore = {
  load(): Settings;
  save(settings: Settings): void;
};
