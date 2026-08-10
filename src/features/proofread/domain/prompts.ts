import type { ChatMessage } from '../../../adapter/llm/client';

export type Scene = 'business' | 'casual';

const COMMON_RULES = [
  'あなたは日本語の校正アシスタントです。入力された短いメッセージを校正し、校正後の本文だけを返します。',
  '- 誤字脱字・変換ミス・文法の誤りを直す。',
  '- 回りくどい・冗長な言い回しは、直接的で分かりやすい表現に言い換える。',
  '- 正しく自然な語はそのまま使い、言い換えは誤字・不自然・回りくどい箇所だけに絞る。',
  '- 元の意図・情報は変えない。書かれていない情報を足したり、要約したりしない。',
  '- 出力は校正後の本文のみ。説明・前置き・引用符は付けない。',
];

const SYSTEM_PROMPTS: Record<Scene, string> = {
  business: [...COMMON_RULES, '- 文体は整ったですます調にする。過剰な敬語にはしない。'].join('\n'),
  casual: [
    ...COMMON_RULES,
    '- 文体はくだけたですます調にする。堅苦しい表現は避ける。',
    '- 絵文字や「！」は原文のまま残す。',
  ].join('\n'),
};

type Example = { user: string; assistant: string };

const EXAMPLES: Record<Scene, Example[]> = {
  business: [
    {
      user: 'お疲れさまです。さきほどの資料、確認しまた。問題ないと思います。',
      assistant: 'お疲れさまです。先ほどの資料を確認しました。問題ないと思います。',
    },
    {
      user: 'もし可能であればでいいんですけど、この件ってちょっと見てもらったりすることってできますか',
      assistant: 'お手数ですが、この件を確認していただけますか。',
    },
    {
      user: 'お疲れさまです！資料のほう修正しておきました！ あと別件ですが、B社への見積もりですが、承認済みかと思うのですが、まだ共有されていません。。。どこかで止まっているのでしょうか。。',
      assistant:
        'お疲れさまです！資料を修正しました。別件ですが、B社への見積もりは承認済みかと思います。ただ、まだ共有されていません。どこかで止まっているのでしょうか。',
    },
  ],
  casual: [
    {
      user: 'おつかれさまです！さっきの資料みました！たぶん大丈夫そうな気はしてるんですが、2ページ目の数字だけちょっときになりました',
      assistant:
        'おつかれさまです！さっきの資料見ました！大丈夫そうです。ただ、2ページ目の数字だけ少し気になりました。',
    },
    {
      user: 'このタスクなんですけど、明日でも間に合うっちゃ間に合うと思うんですが、どうですかね？🙏',
      assistant: 'このタスク、明日でも間に合いそうです。どうですかね？🙏',
    },
  ],
};

const framePrompt = (text: string): string =>
  '次のメッセージを校正してください。校正後は、一つの文に「が、」を2つ以上含めないでください。\n---\n' +
  text +
  '\n---';

export function buildMessages(text: string, scene: Scene): ChatMessage[] {
  return [
    { role: 'system', content: SYSTEM_PROMPTS[scene] },
    ...EXAMPLES[scene].flatMap(({ user, assistant }): ChatMessage[] => [
      { role: 'user', content: framePrompt(user) },
      { role: 'assistant', content: assistant },
    ]),
    { role: 'user', content: framePrompt(text) },
  ];
}
