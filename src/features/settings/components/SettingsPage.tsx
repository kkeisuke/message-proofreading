import { getLLMRuntimeById, type LLMRuntimeId } from '../../../api/llmRuntime';
import { useLLMRuntimeStatus } from '../../../hooks/useLLMRuntimeStatus';
import { useSettings } from '../hooks/useSettings';
import { LLMRuntimeSelector } from './LLMRuntimeSelector';
import { ModelSelector } from './ModelSelector';
import styles from './SettingsPage.module.css';

export function SettingsPage() {
  const { settings, saveSettings } = useSettings();
  const { modelList, refresh } = useLLMRuntimeStatus();
  const llmRuntime = getLLMRuntimeById(settings.llmRuntimeId);

  const selectLLMRuntime = (llmRuntimeId: LLMRuntimeId) => {
    saveSettings({ llmRuntimeId, model: null });
    refresh(getLLMRuntimeById(llmRuntimeId).baseUrl);
  };

  return (
    <main className={styles.settingsPage}>
      <LLMRuntimeSelector value={settings.llmRuntimeId} onChange={selectLLMRuntime} />
      <ModelSelector
        modelList={modelList}
        value={settings.model}
        llmStartHint={llmRuntime.llmStartHint}
        onChange={(model) => saveSettings({ ...settings, model })}
      />
    </main>
  );
}
