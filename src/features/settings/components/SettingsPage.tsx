import { baseUrlOf, llmStartHintOf } from '../../../api/connection';
import { useModelList, type ListModelsFn } from '../hooks/useModelList';
import { useSettings } from '../hooks/useSettings';
import { LLMRuntimeSelector } from './LLMRuntimeSelector';
import { ModelSelector } from './ModelSelector';
import './SettingsPage.css';

type Props = { listModels: ListModelsFn };

export function SettingsPage({ listModels }: Props) {
  const { settings, saveSettings } = useSettings();
  const modelList = useModelList(listModels, baseUrlOf(settings.llmRuntimeId));

  return (
    <main className="settings-page">
      <LLMRuntimeSelector
        value={settings.llmRuntimeId}
        onChange={(llmRuntimeId) => saveSettings({ llmRuntimeId, model: null })}
      />
      <ModelSelector
        modelList={modelList}
        value={settings.model}
        llmStartHint={llmStartHintOf(settings.llmRuntimeId)}
        onChange={(model) => saveSettings({ ...settings, model })}
      />
    </main>
  );
}
