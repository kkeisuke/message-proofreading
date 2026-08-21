import type { GenerateFn } from '../domain/proofread';
import { useProofreadPage } from '../hooks/useProofreadPage';
import { CopyButton } from './CopyButton';
import { MessageInput } from './MessageInput';
import { ModelNotSelectedView } from './ModelNotSelectedView';
import { ProofreadButton } from './ProofreadButton';
import { ProofreadErrorView } from './ProofreadErrorView';
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
      <MessageInput value={page.input} onChange={page.setInput} />
      <ProofreadButton
        phase={page.phase}
        canRun={page.canRun}
        onRun={page.run}
        onCancel={page.cancel}
      />
      {page.error ? (
        <ProofreadErrorView error={page.error} llmStartHint={llmStartHint} />
      ) : (
        <ProofreadTextView proofreadText={page.proofreadText} running={running} />
      )}
      <CopyButton text={page.proofreadText} disabled={running || !page.proofreadText} />
    </main>
  );
}
