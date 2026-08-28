# プロジェクト概要

ローカル LLM（Gemma 4 12B）を使ったメッセージ校正・返信作成デスクトップアプリ。
業務メッセージを外部に送らずに扱うことが目的。

## 構成

Tauri v2 + React + TypeScript。LLM は外部ランタイム（Docker Model Runner / Ollama）の OpenAI 互換 API に接続する。

- `src/api/` — LLM API との契約。接続先・メッセージ形式・エラー種別・設定の型。I/O を持たない
- `src/adapter/` — 外部との接続実装。`llm/` と `storage/`
- `src/features/` — 校正・返信・設定。カプセル化され、adapter を知らない
- `src/main.tsx` `src/routes/` — 合成の起点。ポートに adapter の実装を注入する
- `src/domain/` — アプリ共通の純粋ロジック。利用シーンと生成結果の整形
- `src/components/` `src/hooks/` `src/styles/` — アプリ共通
  - `components/` は状態を持たない。ロジックは `hooks/` の共通 hook に置き、ページの hook が組み立てる
  - どの feature にも属さない Provider も `hooks/` に置く

## コマンド

```
pnpm tauri dev    開発用にアプリを起動
pnpm tauri build  配布用の .app と DMG を作る
pnpm lint         oxlint（型情報あり）
pnpm test         Vitest
pnpm build        型チェック + フロントエンドのビルド
```

pnpm は mise 管理。コミット前に lint / format:check / test / build を通すこと。

## 触るときに注意する箇所

- **外部送信の防止は三層で成り立つ**。一つでも欠けると本文が外部へ出る
  - `capabilities/default.json` の scope — 最初の URL のみ検査する
  - `adapter/llm/client.ts` の `maxRedirections: 0` — リダイレクト追跡を止める
  - `tauri.conf.json` の CSP — WebView 自身の通信・フォーム送信を塞ぐ
- プロンプト文面と `cleanGeneratedText.ts` の正規表現は実測をもとに調整済み。安易に変えない
  - 調整で分かったことは `docs/design.md` §8.1 と §9.1 の脚注にある。同じ回り道をしないため先に読む
- `client.ts` の思考出力を止める指定を外すと、生成時間が10倍近くになる
- 命名・コンポーネントの分割・状態の持ち方は `docs/design.md` の §6〜§7 に従う

## ドキュメント

- `docs/requirements.md` — 要求分析・要件定義
- `docs/design.md` — 設計書

## ルール

- ドキュメントの作成・編集は `.claude/rules/documentation.md` に従う
- git の扱いは `.claude/rules/git.md` に従う
