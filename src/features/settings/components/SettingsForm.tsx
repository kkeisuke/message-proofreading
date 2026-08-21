import { LLM_RUNTIMES, type Settings } from '../../../api/connection';
import type { SettingsStore } from '../domain/settingsStore';
import { useSettings } from '../hooks/useSettings';
import './SettingsForm.css';

type Props = {
  store: SettingsStore;
  models: string[];
  error: string | null;
  onPresetChange?: () => void;
};

export function SettingsForm({ store, models, error, onPresetChange }: Props) {
  const { settings, save } = useSettings(store);

  const setPreset = (llmRuntimeId: Settings['llmRuntimeId']) => {
    save({ llmRuntimeId, model: null });
    onPresetChange?.();
  };
  const setModel = (model: string) => save({ ...settings, model });

  return (
    <form className="settings-form">
      <fieldset>
        <legend>接続先</legend>
        {LLM_RUNTIMES.map((runtime) => (
          <label key={runtime.id}>
            <input
              type="radio"
              name="preset"
              checked={settings.llmRuntimeId === runtime.id}
              onChange={() => setPreset(runtime.id)}
            />
            {runtime.label}
          </label>
        ))}
      </fieldset>

      <fieldset>
        <legend>モデル</legend>
        {error ? (
          <p className="settings-form-error" role="alert">
            接続できません。
            {LLM_RUNTIMES.find((runtime) => runtime.id === settings.llmRuntimeId)!.llmStartHint}
          </p>
        ) : (
          <select value={settings.model ?? ''} onChange={(e) => setModel(e.currentTarget.value)}>
            <option value="" disabled>
              モデルを選択
            </option>
            {models.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        )}
      </fieldset>
    </form>
  );
}
