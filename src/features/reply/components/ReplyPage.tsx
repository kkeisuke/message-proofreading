import { CopyButton } from '../../../components/CopyButton';
import { GenerateButton } from '../../../components/GenerateButton';
import { GeneratedTextView } from '../../../components/GeneratedTextView';
import { GenerationErrorView } from '../../../components/GenerationErrorView';
import { MessageInput } from '../../../components/MessageInput';
import { ModelNotSelectedView } from '../../../components/ModelNotSelectedView';
import { UsageSceneSelector } from '../../../components/UsageSceneSelector';
import type { StreamTextFn } from '../../../hooks/useGeneration';
import { useReplyPage } from '../hooks/useReplyPage';
import './ReplyPage.css';

type Props = {
  streamText: StreamTextFn;
  baseUrl: string;
  model: string | null;
  llmStartHint: string;
};

export function ReplyPage({ streamText, baseUrl, model, llmStartHint }: Props) {
  const page = useReplyPage(streamText, baseUrl, model);

  if (!page.isModelSelected) {
    return <ModelNotSelectedView />;
  }

  const running = page.status === 'running';
  return (
    <main className="reply-page">
      <UsageSceneSelector value={page.usageScene} onChange={page.setUsageScene} />
      <MessageInput
        label="相手のメッセージ"
        value={page.receivedMessage}
        onChange={page.setReceivedMessage}
        placeholder="返信したいメッセージを貼り付け"
      />
      <MessageInput
        label="伝えたいこと"
        value={page.keyPoints}
        onChange={page.setKeyPoints}
        placeholder="要点を箇条書きや殴り書きで"
      />
      <GenerateButton
        status={page.status}
        canRun={page.canRun}
        label="返信を作る"
        onRun={page.run}
        onCancel={page.cancel}
      />
      {page.error ? (
        <GenerationErrorView error={page.error} llmStartHint={llmStartHint} />
      ) : (
        <GeneratedTextView
          generatedText={page.replyText}
          running={running}
          placeholder="返信案がここに表示されます"
        />
      )}
      <CopyButton
        copyStatus={page.copyStatus}
        toastRef={page.toastRef}
        disabled={running || !page.replyText}
        onCopy={page.copy}
      />
    </main>
  );
}
