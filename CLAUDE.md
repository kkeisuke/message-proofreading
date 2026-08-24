# プロジェクト概要

ローカル LLM（Gemma 4 E4B）を使ったメッセージ校正デスクトップアプリ。
業務メッセージを外部に送らずに校正することが目的。

## 構成

Tauri v2 + React + TypeScript。LLM は外部ランタイム（Docker Model Runner / Ollama）の OpenAI 互換 API に接続する。

- `src/api/` — LLM API との契約。接続先・メッセージ形式・エラー種別・設定の型。I/O を持たない
- `src/adapter/` — 外部との接続実装。`llm/` と `storage/`
- `src/features/` — 校正と設定。カプセル化され、adapter を知らない
- `src/main.tsx` `src/routes/` — 合成の起点。ポートに adapter の実装を注入する
- `src/components/` `src/hooks/` `src/styles/` — アプリ共通。どの feature にも属さない Provider は `hooks/` に置く

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
- プロンプト文面と `cleanGeneratedText.ts` の正規表現は実測で較正済み。安易に変えない
- 命名・コンポーネントの分割・状態の持ち方は `docs/design.md` の §6〜§7 に従う

## ドキュメント

- `docs/requirements.md` — 要求分析・要件定義
- `docs/design.md` — 設計書

## ルール

- 応答は日本語で行う
- ドキュメントの作成・編集は `.claude/rules/documentation.md` に従う
- git の扱いは `.claude/rules/git.md` に従う

# 出力ルール

- 各レスポンスの末尾に、参照したルールとそのファイルを明記すること。
- リスト形式ですべての参照ルールを列挙すること。

```
参照ルール
- ルール名
  - .claude/rules/ファイル名
```
