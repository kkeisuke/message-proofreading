import type { ModelList } from '../../../hooks/useLLMRuntimeStatus';
import styles from './ModelSelector.module.css';

type Props = {
  modelList: ModelList;
  value: string | null;
  llmStartHint: string;
  onChange: (model: string) => void;
};

export function ModelSelector({ modelList, value, llmStartHint, onChange }: Props) {
  return (
    <fieldset className={styles.modelSelector}>
      <legend>モデル</legend>
      {modelList.status === 'error' ? (
        <p className={styles.modelSelectorError} role="alert">
          接続できません。{llmStartHint}
        </p>
      ) : (
        <select
          value={value ?? ''}
          disabled={modelList.status === 'loading'}
          onChange={(e) => onChange(e.currentTarget.value)}
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
  );
}
