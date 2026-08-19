import type { ChatMessage } from '../../../api/chat';
import { cleanup } from './cleanup';
import { buildMessages, type Scene } from './prompts';

export type GenerateFn = (
  messages: ChatMessage[],
  opts: { signal?: AbortSignal; onChunk?: (acc: string) => void },
) => Promise<string>;

export type ProofreadResult = { proposal: string };

export async function proofread(
  input: string,
  scene: Scene,
  generate: GenerateFn,
  opts: { signal?: AbortSignal; onChunk?: (acc: string) => void } = {},
): Promise<ProofreadResult> {
  const raw = await generate(buildMessages(input, scene), opts);
  return { proposal: cleanup(raw) };
}
