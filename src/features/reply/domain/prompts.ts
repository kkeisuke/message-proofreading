import type { ChatMessage } from '../../../api/chat';
import type { UsageScene } from '../../../domain/usageScene';

const COMMON_RULES = [
  'あなたは日本語の返信文アシスタントです。受け取ったメッセージと、書き手が伝えたいことをもとに返信文を作り、返信の本文だけを返します。',
  '- 返信は相手のメッセージの論点を順にたどり、それぞれに一文以上を返す。質問には答え、報告や依頼には受け止めを返す。',
  '- 各論点への返しには、可否・日時・担当・次にやることのいずれかを示す。',
  '- 伝えたいことは、自分の言葉に置き換えて組み込む。',
  '- 伝えたいことのうち、相手に伝える必要のない背景や前提は、文面の選び方にだけ反映する。',
  '- 返信は自分の立場から書く。相手が自分の目的や事情を説明した語は、相手のものとして扱う。',
  '- 伝えたいことに答えのない論点は、受け取ったことだけを短く伝える。',
  '- 約束する予定・数値・可否は、伝えたいことに書かれたものだけにする。書かれていない約束を足さない。',
  '- 返信の長さは相手のメッセージに合わせる。短いメッセージには短く、詳しいメッセージには見合う長さで返す。',
  '- 一文ずつは簡潔にし、読みやすく書く。一つの文に「が、」を2つ以上含めない。',
  '- 論点が複数あるときは、論点の切れ目で改行する。1つだけなら改行しない。',
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
      receivedMessage: 'お疲れさまです。来週の定例、木曜に変更できますか。',
      keyPoints: '木曜の14時なら大丈夫',
      assistant: 'お疲れさまです。木曜の14時であれば対応できます。よろしくお願いします。',
    },
    {
      receivedMessage:
        'お疲れさまです。先日の定例で出た件、いくつか整理しました。まず来月のリリースですが、QA の期間を1週間確保したいので、コード凍結を1週間前倒しできないでしょうか。あわせて、リリースノートの担当を決めたいです。あと、障害時の連絡先が古いままなので、更新をお願いできますか。',
      keyPoints:
        '・コード凍結の前倒しはOK\n・リリースノートは自分がやる\n・連絡先は今週中に直す\n・来週は休みを取るので今週中に片付けたい',
      assistant:
        'お疲れさまです。整理いただきありがとうございます。\n凍結日は1週間繰り上げて調整します。QA に1週間取れる形になります。\nリリースノートは私が引き受けます。\n連絡先は今週中に最新のものへ差し替えます。',
    },
  ],
  casual: [
    {
      receivedMessage:
        'おつかれさまです！明日の打ち合わせって、資料事前に共有したほうがいいですかね？あと場所どこでしたっけ🙏',
      keyPoints: '資料は当日でOK 場所は3階の会議室B 資料はまだ直してる途中',
      assistant:
        'おつかれさまです！\n資料は当日そのまま配れば大丈夫です。事前の共有はなしでいきましょう。\n場所は3階の会議室Bです🙏',
    },
    {
      receivedMessage: '例のバグ、今日中に直したほうがいいですか？',
      keyPoints: '急ぎじゃない 明日でいい',
      assistant: '急ぎではないので明日で大丈夫です！',
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
