import { CopyButton } from '../../../components/CopyButton';
import { GenerateButton } from '../../../components/GenerateButton';
import { GeneratedTextView } from '../../../components/GeneratedTextView';
import { GenerationErrorView } from '../../../components/GenerationErrorView';
import { MessageInput } from '../../../components/MessageInput';
import { ModelNotSelectedView } from '../../../components/ModelNotSelectedView';
import { UsageSceneSelector } from '../../../components/UsageSceneSelector';
import type { StreamTextFn } from '../../../hooks/useGeneration';
import { useProofreadPage } from '../hooks/useProofreadPage';
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
      <MessageInput
        value={page.input}
        onChange={page.setInput}
        placeholder="校正したいメッセージを貼り付け"
      />
      <GenerateButton
        status={page.status}
        canRun={page.canRun}
        label="校正する"
        onRun={page.run}
        onCancel={page.cancel}
      />
      {page.error ? (
        <GenerationErrorView error={page.error} llmStartHint={llmStartHint} />
      ) : (
        <GeneratedTextView
          generatedText={page.proofreadText}
          running={running}
          placeholder="校正結果がここに表示されます"
        />
      )}
      <CopyButton
        copyStatus={page.copyStatus}
        toastRef={page.toastRef}
        disabled={running || !page.proofreadText}
        onCopy={page.copy}
      />
    </main>
  );
}
