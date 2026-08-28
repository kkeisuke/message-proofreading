import type { ChatMessage } from '../../../api/chat';
import type { UsageScene } from '../../../domain/usageScene';

const COMMON_RULES = [
  'あなたは日本語の返信文アシスタントです。受け取ったメッセージと、書き手が伝えたいことをもとに返信文を作り、返信の本文だけを返します。',
  '- 伝えたいことに書かれた内容だけを使う。書かれていない予定・数値・約束を足さない。',
  '- 伝えたいことが箇条書きや殴り書きでも、そのまま並べずに文章にする。',
  '- 相手の質問には漏れなく答える。',
  '- 読みやすく簡潔にする。一つの文に「が、」を2つ以上含めない。',
  '- 出力は返信の本文のみ。説明・前置き・引用符は付けない。',
];

const SYSTEM_PROMPTS: Record<UsageScene, string> = {
  business: [...COMMON_RULES, '- 文体は整ったですます調にする。過剰な敬語にはしない。'].join('\n'),
  casual: [
    ...COMMON_RULES,
    '- 文体はくだけたですます調にする。堅苦しい表現は避ける。',
    '- 絵文字や「！」は相手のメッセージの雰囲気に合わせて使ってよい。',
  ].join('\n'),
};

type Example = { receivedMessage: string; keyPoints: string; assistant: string };

const EXAMPLES: Record<UsageScene, Example[]> = {
  business: [
    {
      receivedMessage:
        'お疲れさまです。来週の定例ですが、水曜の14時から16時に変更できないでしょうか。難しければ木曜でも構いません。',
      keyPoints: '水曜は別件で無理 木曜の14時なら大丈夫',
      assistant:
        'お疲れさまです。水曜は別件があり難しいです。木曜の14時であれば対応できます。よろしくお願いします。',
    },
    {
      receivedMessage:
        '先ほど共有いただいた見積もりの件、社内で確認しました。金額は問題ないのですが、納期を2週間ほど早められませんか。',
      keyPoints: '・2週間は無理\n・1週間なら調整できる\n・その場合は追加費用が出るかも',
      assistant:
        'ご確認ありがとうございます。2週間の短縮は難しいですが、1週間であれば調整できます。その場合は追加費用が発生する可能性があります。',
    },
  ],
  casual: [
    {
      receivedMessage:
        'おつかれさまです！明日の打ち合わせって、資料事前に共有したほうがいいですかね？あと場所どこでしたっけ🙏',
      keyPoints: '資料は当日でOK 場所は3階の会議室B',
      assistant: 'おつかれさまです！資料は当日で大丈夫です。場所は3階の会議室Bです🙏',
    },
    {
      receivedMessage:
        '例のバグ、再現できました！ログも取れてます。今日中に直したほうがいいですか？',
      keyPoints: '助かる 急ぎじゃないので明日でいい ログだけ先に見たい',
      assistant: '助かります！急ぎではないので明日で大丈夫です。ログだけ先に見せてもらえますか？',
    },
  ],
};

const framePrompt = (receivedMessage: string, keyPoints: string): string =>
  '次のメッセージへの返信を書いてください。\n' +
  '[相手のメッセージ]\n---\n' +
  receivedMessage +
  '\n---\n' +
  '[伝えたいこと]\n---\n' +
  keyPoints +
  '\n---';

export function buildReplyPrompt(
  receivedMessage: string,
  keyPoints: string,
  usageScene: UsageScene,
): ChatMessage[] {
  return [
    { role: 'system', content: SYSTEM_PROMPTS[usageScene] },
    ...EXAMPLES[usageScene].flatMap((example): ChatMessage[] => [
      { role: 'user', content: framePrompt(example.receivedMessage, example.keyPoints) },
      { role: 'assistant', content: example.assistant },
    ]),
    { role: 'user', content: framePrompt(receivedMessage, keyPoints) },
  ];
}
