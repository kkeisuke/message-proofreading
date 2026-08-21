import type { ChatMessage } from '../../../api/chat';
import { cleanGeneratedText } from './cleanGeneratedText';
import { buildMessages, type UsageScene } from './prompts';

export type GenerateFn = (
  messages: ChatMessage[],
  opts: { signal?: AbortSignal; onChunk?: (acc: string) => void },
) => Promise<string>;

export type ProofreadResult = { proofreadText: string };

export async function proofread(
  input: string,
  scene: UsageScene,
  generate: GenerateFn,
  opts: { signal?: AbortSignal; onChunk?: (acc: string) => void } = {},
): Promise<ProofreadResult> {
  const raw = await generate(buildMessages(input, scene), opts);
  return { proofreadText: cleanGeneratedText(raw) };
}
