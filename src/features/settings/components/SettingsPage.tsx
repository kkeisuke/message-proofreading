import { getLLMRuntimeById } from '../../../api/connection';
import { useModelList, type ListModelsFn } from '../hooks/useModelList';
import { useSettings } from '../hooks/useSettings';
import { LLMRuntimeSelector } from './LLMRuntimeSelector';
import { ModelSelector } from './ModelSelector';
import './SettingsPage.css';

type Props = { listModels: ListModelsFn };

export function SettingsPage({ listModels }: Props) {
  const { settings, saveSettings } = useSettings();
  const llmRuntime = getLLMRuntimeById(settings.llmRuntimeId);
  const modelList = useModelList(listModels, llmRuntime.baseUrl);

  return (
    <main className="settings-page">
      <LLMRuntimeSelector
        value={settings.llmRuntimeId}
        onChange={(llmRuntimeId) => saveSettings({ llmRuntimeId, model: null })}
      />
      <ModelSelector
        modelList={modelList}
        value={settings.model}
        llmStartHint={llmRuntime.llmStartHint}
        onChange={(model) => saveSettings({ ...settings, model })}
      />
    </main>
  );
}
