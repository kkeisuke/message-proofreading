import { useProofreadPage, type StreamTextFn } from '../hooks/useProofreadPage';
import { CopyButton } from './CopyButton';
import { MessageInput } from './MessageInput';
import { ModelNotSelectedView } from './ModelNotSelectedView';
import { ProofreadButton } from './ProofreadButton';
import { ProofreadErrorView } from './ProofreadErrorView';
import { ProofreadTextView } from './ProofreadTextView';
import { UsageSceneSelector } from './UsageSceneSelector';
import './ProofreadPage.css';

type Props = {
  streamText: StreamTextFn;
  baseUrl: string;
  model: string | null;
  llmStartHint: string;
};

export function ProofreadPage({ streamText, baseUrl, model, llmStartHint }: Props) {
  const page = useProofreadPage(streamText, baseUrl, model);

  if (!page.isModelSelected) {
    return <ModelNotSelectedView />;
  }

  const running = page.status === 'running';
  return (
    <main className="proofread-page">
      <UsageSceneSelector value={page.usageScene} onChange={page.setUsageScene} />
      <MessageInput value={page.input} onChange={page.setInput} />
      <ProofreadButton
        status={page.status}
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
