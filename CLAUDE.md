# プロジェクト概要

ローカル LLM（Gemma 4 E4B）を使ったメッセージ校正デスクトップアプリ。
業務メッセージを外部に送らずに校正することが目的。

## 現在のフェーズ

実装完了。動作確認とコードレビューへの対応まで終えている。

## 構成

Tauri v2 + React + TypeScript。LLM は外部ランタイム（Docker Model Runner / Ollama）の OpenAI 互換 API に接続する。

- `src/api/` — LLM API との契約。接続先プリセット・メッセージ形式・エラー種別。I/O を持たない
- `src/adapter/` — 外部との接続実装。`llm/` と `storage/`
- `src/features/` — 校正と設定。カプセル化され、adapter を知らない
- `src/routes/` — 合成の起点。ポートに adapter の実装を注入する
- `src/components/` `src/hooks/` `src/styles/` — アプリ共通

## コマンド

```
pnpm tauri dev    アプリを起動
pnpm lint         oxlint（型情報あり）
pnpm test         Vitest
pnpm build        型チェック + ビルド
```

pnpm は mise 管理。コミット前に lint / format:check / test / build を通すこと。

## 触るときに注意する箇所

- **外部送信の防止は三層で成り立つ**。一つでも欠けると本文が外部へ出る
  - `capabilities/default.json` の scope — 最初の URL のみ検査する
  - `adapter/llm/client.ts` の `maxRedirections: 0` — リダイレクト追跡を止める
  - `tauri.conf.json` の CSP — WebView 自身の通信・フォーム送信を塞ぐ
- プロンプト文面と `cleanup.ts` の正規表現は実測で較正済み。安易に変えない

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
