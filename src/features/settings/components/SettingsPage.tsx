import { baseUrlOf, LLM_RUNTIMES, llmStartHintOf, type Settings } from '../../../api/connection';
import { useModelList, type ListModelsFn } from '../hooks/useModelList';
import { useSettings } from '../hooks/useSettings';
import './SettingsPage.css';

type Props = { listModels: ListModelsFn };

export function SettingsPage({ listModels }: Props) {
  const { settings, saveSettings } = useSettings();
  const modelList = useModelList(listModels, baseUrlOf(settings.llmRuntimeId));

  const setLLMRuntime = (llmRuntimeId: Settings['llmRuntimeId']) =>
    saveSettings({ llmRuntimeId, model: null });
  const setModel = (model: string) => saveSettings({ ...settings, model });

  return (
    <main className="settings-page">
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
        {modelList.status === 'error' ? (
          <p className="settings-page-error" role="alert">
            接続できません。{llmStartHintOf(settings.llmRuntimeId)}
          </p>
        ) : (
          <select
            value={settings.model ?? ''}
            disabled={modelList.status === 'loading'}
            onChange={(e) => setModel(e.currentTarget.value)}
          >
            <option value="" disabled>
              {modelList.status === 'loading' ? '読み込み中…' : 'モデルを選択'}
            </option>
            {modelList.status === 'ready'
              ? modelList.models.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))
              : null}
          </select>
        )}
      </fieldset>
    </main>
  );
}
