# メッセージ校正

業務メッセージを外部に送らずに校正するデスクトップアプリ。

校正は手元で動かしている LLM ランタイムに任せる。メッセージの送信先はローカルエンドポイントのみで、クラウドの API は使わない。

## できること

- 貼り付けたメッセージを、読みやすく簡潔な文面に直す
- ビジネス / カジュアルの2つのシーンで文体を変える
- 同じ入力で校正し直して別の案を得る
- 校正案をワンクリックでコピーする

## 動作環境

- Apple Silicon の Mac
- Docker Model Runner または Ollama
  - どちらも OpenAI 互換 API を localhost に提供する

## 準備

### 1. ツールを揃える

Node.js・pnpm・Rust は [mise](https://mise.jdx.dev/) が管理する。

```
mise install
pnpm install
```

### 2. LLM ランタイムを起動する

どちらか一方でよい。

**Docker Model Runner**

```
docker desktop enable model-runner --tcp=12434
docker model pull ai/gemma4:e4b-q4_K_M
```

**Ollama**

```
ollama serve
```

## ビルドとインストール

```
pnpm tauri build
```

`src-tauri/target/release/bundle/` に `.app` と DMG が出力される[^1]。

DMG を開き、`message-proofreading.app` を `/Applications` にドラッグする。

初回起動時に設定画面で接続先とモデルを選ぶ。選んだ内容は次回以降も保持される。

## 開発

```
pnpm tauri dev    開発用にアプリを起動
pnpm lint         oxlint（型情報あり）
pnpm format       oxfmt
pnpm test         Vitest
pnpm build        型チェック + フロントエンドのビルド
```

コミット前に `lint` / `format:check` / `test` / `build` を通す。

## ドキュメント

- [docs/requirements.md](docs/requirements.md) — 要求分析・要件定義
- [docs/design.md](docs/design.md) — 設計書

[^1]: 配布用の署名はしていないため、DMG を他の Mac に渡すと Gatekeeper に止められる。使う Mac でビルドする。
