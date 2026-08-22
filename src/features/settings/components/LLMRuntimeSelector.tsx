import { LLM_RUNTIMES, type LLMRuntimeId } from '../../../api/llmRuntime';
import './LLMRuntimeSelector.css';

type Props = { value: LLMRuntimeId; onChange: (llmRuntimeId: LLMRuntimeId) => void };

export function LLMRuntimeSelector({ value, onChange }: Props) {
  return (
    <fieldset className="llm-runtime-selector">
      <legend>接続先</legend>
      {LLM_RUNTIMES.map((runtime) => (
        <label key={runtime.id}>
          <input
            type="radio"
            name="llm-runtime"
            checked={value === runtime.id}
            onChange={() => onChange(runtime.id)}
          />
          {runtime.label}
        </label>
      ))}
    </fieldset>
  );
}
