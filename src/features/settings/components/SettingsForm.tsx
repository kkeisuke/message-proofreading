import { PRESETS, type Settings } from '../../../api/connection';
import { useSettings } from '../hooks/useSettings';
import './SettingsForm.css';

type Props = { models: string[]; error: string | null; onPresetChange?: () => void };

export function SettingsForm({ models, error, onPresetChange }: Props) {
  const { settings, save } = useSettings();

  const setPreset = (presetId: Settings['presetId']) => {
    save({ presetId, model: null });
    onPresetChange?.();
  };
  const setModel = (model: string) => save({ ...settings, model });

  return (
    <form className="settings-form">
      <fieldset>
        <legend>接続先</legend>
        {PRESETS.map((p) => (
          <label key={p.id}>
            <input
              type="radio"
              name="preset"
              checked={settings.presetId === p.id}
              onChange={() => setPreset(p.id)}
            />
            {p.label}
          </label>
        ))}
      </fieldset>

      <fieldset>
        <legend>モデル</legend>
        {error ? (
          <p className="settings-form-error" role="alert">
            接続できません。{PRESETS.find((p) => p.id === settings.presetId)!.startHint}
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
