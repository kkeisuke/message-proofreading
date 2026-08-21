import { LLM_RUNTIMES, llmStartHintOf, type Settings } from '../../../api/connection';
import { useSettings } from '../hooks/useSettings';
import './SettingsForm.css';

type Props = {
  models: string[];
  error: string | null;
  onLLMRuntimeChange?: () => void;
};

export function SettingsForm({ models, error, onLLMRuntimeChange }: Props) {
  const { settings, saveSettings } = useSettings();

  const setLLMRuntime = (llmRuntimeId: Settings['llmRuntimeId']) => {
    saveSettings({ llmRuntimeId, model: null });
    onLLMRuntimeChange?.();
  };
  const setModel = (model: string) => saveSettings({ ...settings, model });

  return (
    <form className="settings-form">
      <fieldset>
        <legend>接続先</legend>
        {LLM_RUNTIMES.map((runtime) => (
          <label key={runtime.id}>
            <input
              type="radio"
              name="llm-runtime"
              checked={settings.llmRuntimeId === runtime.id}
              onChange={() => setLLMRuntime(runtime.id)}
            />
            {runtime.label}
          </label>
        ))}
      </fieldset>

      <fieldset>
        <legend>モデル</legend>
        {error ? (
          <p className="settings-form-error" role="alert">
            接続できません。{llmStartHintOf(settings.llmRuntimeId)}
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
