import { fetch as tauriFetch } from '@tauri-apps/plugin-http';
import { createFileRoute } from '@tanstack/react-router';
import { streamChat } from '../adapter/llm/client';
import { getLLMRuntimeById } from '../api/llmRuntime';
import { ProofreadPage, useGenerate } from '../features/proofread';
import { useSettings } from '../features/settings';

export const Route = createFileRoute('/')({ component: IndexRoute });

function IndexRoute() {
  const { settings } = useSettings();
  const { baseUrl, llmStartHint } = getLLMRuntimeById(settings.llmRuntimeId);
  const generate = useGenerate(
    (config, messages, opts) => streamChat(tauriFetch, config, messages, opts),
    baseUrl,
    settings.model,
  );

  return <ProofreadPage generate={generate} llmStartHint={llmStartHint} />;
}
