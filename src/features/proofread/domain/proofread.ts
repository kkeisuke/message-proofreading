import type { ChatMessage, ChatStreamOptions } from '../../../api/chat';
import { cleanGeneratedText } from './cleanGeneratedText';
import { buildMessages, type UsageScene } from './prompts';

export type GenerateFn = (messages: ChatMessage[], opts: ChatStreamOptions) => Promise<string>;

export async function proofread(
  input: string,
  scene: UsageScene,
  generate: GenerateFn,
  opts: ChatStreamOptions = {},
): Promise<string> {
  return cleanGeneratedText(await generate(buildMessages(input, scene), opts));
}
