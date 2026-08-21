import type { GenerateFn } from '../domain/proofread';
import { useProofreadPage } from '../hooks/useProofreadPage';
import { CopyButton } from './CopyButton';
import { ModelNotSelectedView } from './ModelNotSelectedView';
import { ProofreadTextView } from './ProofreadTextView';
import { UsageSceneSelector } from './UsageSceneSelector';
import './ProofreadPage.css';

type Props = { generate: GenerateFn | null; llmStartHint: string };

export function ProofreadPage({ generate, llmStartHint }: Props) {
  const page = useProofreadPage(generate);

  if (!page.isModelSelected) return <ModelNotSelectedView />;

  const running = page.phase === 'running';
  return (
    <main className="proofread-page">
      <UsageSceneSelector value={page.scene} onChange={page.setUsageScene} />
      <textarea
        value={page.input}
        onChange={(e) => page.setInput(e.currentTarget.value)}
        placeholder="校正したいメッセージを貼り付け"
        rows={5}
      />
      {running ? (
        <button type="button" onClick={page.cancel}>
          中断
        </button>
      ) : (
        <button type="button" disabled={!page.canRun} onClick={page.run}>
          校正する
        </button>
      )}
      <ProofreadTextView
        proofreadText={page.proofreadText}
        running={running}
        error={page.error}
        llmStartHint={llmStartHint}
      />
      <CopyButton text={page.proofreadText} disabled={running || !page.proofreadText} />
    </main>
  );
}
