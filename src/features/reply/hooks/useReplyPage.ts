import { useState } from 'react';
import type { UsageScene } from '../../../domain/usageScene';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import { useGeneration, type StreamTextFn } from '../../../hooks/useGeneration';
import { buildReplyPrompt } from '../domain/prompts';

/** 返信画面が持つ状態と操作をまとめる。コンポーネントは受け取ったものを描くだけにする。 */
export function useReplyPage(streamText: StreamTextFn, baseUrl: string, model: string | null) {
  const [receivedMessage, setReceivedMessage] = useState('');
  const [keyPoints, setKeyPoints] = useState('');
  const [usageScene, setUsageScene] = useState<UsageScene>('business');
  const generation = useGeneration(streamText, baseUrl, model);
  const clipboard = useCopyToClipboard();

  return {
    receivedMessage,
    setReceivedMessage,
    keyPoints,
    setKeyPoints,
    usageScene,
    setUsageScene,
    status: generation.status,
    replyText: generation.generatedText,
    error: generation.error,
    isModelSelected: generation.isModelSelected,
    // 相手のメッセージと要点の両方が揃うまで生成させない（F14）。
    canRun: receivedMessage.trim().length > 0 && keyPoints.trim().length > 0,
    run: () =>
      generation.run(buildReplyPrompt(receivedMessage.trim(), keyPoints.trim(), usageScene)),
    cancel: generation.cancel,
    copyStatus: clipboard.copyStatus,
    toastRef: clipboard.toastRef,
    copy: () => clipboard.copy(generation.generatedText),
  };
}
