# メッセージ校正デスクトップアプリ 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** docs/requirements.md / docs/design.md に基づく Tauri デスクトップアプリを実装する。

**Architecture:** Tauri v2 + React + TanStack Router。LLM は外部ランタイム（OpenAI 互換 API）に tauri-plugin-http で接続。Feature 型 + ポート＆アダプタ（詳細は docs/design.md §5）。

**Tech Stack:** Tauri v2 / tauri-plugin-http / React / TanStack Router v1 / Vite / TypeScript / Vitest / pnpm / oxlint / oxfmt / 素の CSS

## Global Constraints

- 外部ライブラリは docs/design.md §2 の表にあるもののみ。追加したくなったら実装を止めてユーザーに確認する
- パッケージ管理は pnpm のみ。npm / yarn を使わない
- 自作の Rust コードは書かない（プラグイン登録のみ）
- TypeScript は strict
- `docs/findings.md` はコミットしない（モックの `index.html` は退避済み。直下の `index.html` は Vite のエントリでコミット対象）
- LLM 通信は OpenAI 互換 API のみ（`/chat/completions`, `/models`）
- コミットメッセージは日本語。Co-Authored-By は付けない
- 実装順の制約: Task 1（Tauri スパイク）を最初に行う。機械検証（F5）は Task 9-10 まで実装しない

## 実行前の準備（ユーザー作業）

- リポジトリ直下の `index.html`（モック・未コミット）を別の場所へ退避する。Vite が同名のエントリファイルを使うため衝突する
- Docker Model Runner を起動し TCP を有効化する: `docker desktop enable model-runner --tcp=12434`（CORS 設定は不要になった）
- `docker model pull ai/gemma4:e4b-q4_K_M` 済みであること

---

### Task 1: プロジェクト scaffold + Tauri 通信スパイク

通信経路（IPC → Rust → Channel）でストリーミング逐次受信と中断が成り立つかを、作り込みの前に確認する（design.md [^9]）。scaffold は本実装で使い続け、スパイク画面だけ後で捨てる。

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`, `src/App.tsx`（スパイク画面）
- Create: `src-tauri/`（`pnpm tauri init` が生成）
- Modify: `.gitignore`, `mise.toml`, `CLAUDE.md`（フェーズ更新）

**Interfaces:**
- Produces: 以降の全タスクの土台。`pnpm tauri dev` で起動するアプリ

- [ ] **Step 1: mise に pnpm を追加**

`mise.toml`:

```toml
[tools]
node = "24.15.0"
pnpm = "latest"
```

Run: `mise install && pnpm --version`

- [ ] **Step 2: Vite + React + TypeScript を手動 scaffold**

`package.json`:

```json
{
  "name": "message-proofreading",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "tauri": "tauri"
  }
}
```

```bash
pnpm add react react-dom
pnpm add -D vite @vitejs/plugin-react typescript @types/react @types/react-dom
```

`vite.config.ts`:

```ts
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: { port: 5173, strictPort: true },
});
```

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  },
  "include": ["src"]
}
```

`index.html`:

```html
<!doctype html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>メッセージ校正</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`src/main.tsx`:

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

`src/App.tsx`（仮。Step 5 で置き換え）:

```tsx
export default function App() {
  return <p>スパイク準備中</p>;
}
```

`.gitignore` に追記:

```
node_modules/
dist/
```

Run: `pnpm dev` → ブラウザで http://localhost:5173 が表示されることを確認して停止

- [ ] **Step 3: Tauri を追加**

```bash
pnpm add -D @tauri-apps/cli
pnpm tauri init --app-name message-proofreading --window-title "メッセージ校正" \
  --frontend-dist ../dist --dev-url http://localhost:5173 \
  --before-dev-command "pnpm dev" --before-build-command "pnpm build"
pnpm tauri add http
```

`pnpm tauri add http` が `@tauri-apps/plugin-http`（npm）と Rust 側プラグインの登録まで行う。

`.gitignore` に追記:

```
src-tauri/target/
```

- [ ] **Step 4: capability で通信先を localhost に限定**

`src-tauri/capabilities/default.json` の `permissions` を次の形にする（`http:default` を scope 付きに置き換え）:

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "windows": ["main"],
  "permissions": [
    "core:default",
    {
      "identifier": "http:default",
      "allow": [{ "url": "http://localhost:*" }]
    }
  ]
}
```

design.md §1 の「構成で二重に保証する」の1段目。CSP（2段目）は `src-tauri/tauri.conf.json` の `app.security.csp` に設定する:

```json
"csp": "default-src 'self'; connect-src 'self' ipc: http://ipc.localhost; style-src 'self' 'unsafe-inline'"
```

設定キーの正確な形は Tauri v2 ドキュメントで確認しながら合わせる。

- [ ] **Step 5: スパイク画面を実装**

`src/App.tsx` を置き換え:

```tsx
import { fetch } from '@tauri-apps/plugin-http';
import { useRef, useState } from 'react';

const BASE = 'http://localhost:12434/engines/v1';
const MODEL = 'ai/gemma4:e4b-q4_K_M';

export default function App() {
  const [log, setLog] = useState<string[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const append = (line: string) => setLog((l) => [...l, line]);

  const run = async () => {
    setLog([]);
    const ac = new AbortController();
    abortRef.current = ac;
    const t0 = performance.now();
    const at = () => `+${Math.round(performance.now() - t0)}ms`;
    try {
      const res = await fetch(`${BASE}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: MODEL,
          stream: true,
          messages: [{ role: 'user', content: '1から20まで数えてください。' }],
        }),
        signal: ac.signal,
      });
      append(`${at()} status: ${res.status}`);
      const reader = res.body!.pipeThrough(new TextDecoderStream()).getReader();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        append(`${at()} chunk: ${value.length}文字`);
      }
      append(`${at()} done`);
    } catch (e) {
      append(`${at()} error: ${String(e)}`);
    }
  };

  return (
    <main>
      <h1>通信スパイク</h1>
      <button onClick={run}>ストリーミング開始</button>
      <button onClick={() => abortRef.current?.abort()}>中断</button>
      <pre>{log.join('\n')}</pre>
    </main>
  );
}
```

- [ ] **Step 6: スパイクを実行して検証（ここが Task 1 のゲート）**

Run: `pnpm tauri dev`

確認項目（すべて満たすこと）:

1. 「ストリーミング開始」→ chunk 行が**異なるタイムスタンプで複数回**出る（1回にまとまって出るなら逐次受信が成立していない）
2. 生成途中に「中断」→ 数秒以内にストリームが止まり、アプリがエラーで壊れない
3. status: 200

**成立しない場合は実装を止めてユーザーに報告する**（ストリーミング表示と中断の設計見直しが必要になるため。design.md [^9]）。

- [ ] **Step 7: CLAUDE.md のフェーズを更新してコミット**

`CLAUDE.md` の「現在のフェーズ」を「実装フェーズ。docs/superpowers/plans/ の計画に従う」に変更。

```bash
git add -A ':!docs/findings.md'
git commit -m "Tauri + React scaffold と通信スパイク

tauri-plugin-http 経由の SSE 逐次受信と AbortSignal での中断を実機確認。"
```

---

### Task 2: ツール整備（oxlint / oxfmt / Vitest）

**Files:**
- Create: `.oxlintrc.json`
- Modify: `package.json`, `vite.config.ts`

**Interfaces:**
- Produces: `pnpm lint` / `pnpm format` / `pnpm test` が全タスクの検証手段になる

- [ ] **Step 1: インストール**

```bash
pnpm add -D oxlint oxfmt vitest
```

- [ ] **Step 2: 設定とスクリプト**

`.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "categories": { "correctness": "error", "suspicious": "warn" },
  "ignorePatterns": ["src/routeTree.gen.ts"]
}
```

`package.json` の scripts に追加:

```json
"lint": "oxlint src",
"format": "oxfmt src",
"format:check": "oxfmt --check src",
"test": "vitest run"
```

oxfmt は beta のため、`pnpm oxfmt --help` で `--check` 等のフラグ名を確認し、実際の CLI に合わせて scripts を調整する。

`vite.config.ts` に Vitest 設定を追加:

```ts
/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: { port: 5173, strictPort: true },
  test: { include: ['src/**/*.test.ts'] },
});
```

- [ ] **Step 3: 動作確認**

Run: `pnpm lint && pnpm format:check && pnpm test`
Expected: lint / format はエラーなし。test は「no test files found」相当の終了（テストは Task 4 から書く）。`pnpm test` がテスト0件で非0終了する場合は `vitest run --passWithNoTests` に直す

- [ ] **Step 4: コミット**

```bash
git add -A ':!docs/findings.md'
git commit -m "oxlint / oxfmt / Vitest を導入"
```

---

### Task 3: TanStack Router とスタイル基盤

**Files:**
- Create: `src/routes/__root.tsx`, `src/routes/index.tsx`, `src/routes/settings.tsx`
- Create: `src/styles/global.css`, `src/styles/tokens.css`
- Modify: `src/main.tsx`, `vite.config.ts`
- Delete: `src/App.tsx`（スパイク画面。役目を終えたため）

**Interfaces:**
- Produces: ルート `/`（校正画面の置き場）と `/settings`（設定画面の置き場）。`__root` にヘッダー
- Produces: `@layer reset, tokens, components;` の CSS レイヤー構造とデザイントークン

- [ ] **Step 1: インストールと Vite プラグイン設定**

```bash
pnpm add @tanstack/react-router
pnpm add -D @tanstack/router-plugin
```

`vite.config.ts` の plugins を更新（router プラグインは react より前に置く）:

```ts
import { tanstackRouter } from '@tanstack/router-plugin/vite';
// plugins: [tanstackRouter({ target: 'react' }), react()],
```

`.gitignore` には追加しない（`src/routeTree.gen.ts` は生成物だがコミットする。lint/format からは除外済み）。

- [ ] **Step 2: スタイル基盤**

`src/styles/tokens.css`:

```css
@layer tokens {
  :root {
    color-scheme: light dark;
    --color-bg: light-dark(oklch(98% 0.005 250), oklch(22% 0.01 250));
    --color-text: light-dark(oklch(25% 0.02 250), oklch(92% 0.005 250));
    --color-accent: oklch(55% 0.15 250);
    --color-border: light-dark(oklch(85% 0.01 250), oklch(35% 0.01 250));
    --color-warn: oklch(60% 0.15 60);
    --space-1: 0.5rem;
    --space-2: 1rem;
    --space-3: 1.5rem;
    --radius: 8px;
  }
}
```

`src/styles/global.css`:

```css
@layer reset, tokens, components;

@import './tokens.css';

@layer reset {
  * {
    margin: 0;
    box-sizing: border-box;
  }
  body {
    font-family: system-ui, sans-serif;
    background: var(--color-bg);
    color: var(--color-text);
  }
  button {
    font: inherit;
  }
}
```

- [ ] **Step 3: ルートを作成**

`src/routes/__root.tsx`:

```tsx
import { createRootRoute, Link, Outlet } from '@tanstack/react-router';

export const Route = createRootRoute({
  component: () => (
    <>
      <header className="app-header">
        <Link to="/">メッセージ校正</Link>
        <Link to="/settings">設定</Link>
      </header>
      <Outlet />
    </>
  ),
});
```

`src/routes/index.tsx`:

```tsx
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: () => <main>校正画面（Task 8 で実装）</main>,
});
```

`src/routes/settings.tsx`:

```tsx
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/settings')({
  component: () => <main>設定画面（Task 7 で実装）</main>,
});
```

`src/main.tsx` を置き換え:

```tsx
import { createRouter, RouterProvider } from '@tanstack/react-router';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { routeTree } from './routeTree.gen';
import './styles/global.css';

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
```

`src/App.tsx` を削除。

- [ ] **Step 4: 動作確認とコミット**

Run: `pnpm tauri dev` → `/` と `/settings` をヘッダーのリンクで行き来できること。`pnpm lint && pnpm test`

```bash
git add -A ':!docs/findings.md'
git commit -m "TanStack Router とスタイル基盤を導入"
```

---

### Task 4: 共有 domain と設定の永続化（adapter/storage）

**Files:**
- Create: `src/domain/connection.ts`
- Create: `src/adapter/storage/settings.ts`, `src/adapter/storage/settings.test.ts`

**Interfaces:**
- Produces: `PRESETS`, `type PresetId`, `type Settings = { presetId: PresetId; model: string | null }`, `baseUrlOf(presetId): string`
- Produces: `loadSettings(storage): Settings`, `saveSettings(storage, settings): void`
  - `storage` は `Pick<Storage, 'getItem' | 'setItem'>`。実行時は `localStorage`、テストでは Map ベースのフェイクを渡す

- [ ] **Step 1: 共有 domain**

`src/domain/connection.ts`:

```ts
export const PRESETS = [
  {
    id: 'model-runner',
    label: 'Docker Model Runner',
    baseUrl: 'http://localhost:12434/engines/v1',
    startHint: 'docker desktop enable model-runner --tcp=12434 を実行してください',
  },
  {
    id: 'ollama',
    label: 'Ollama',
    baseUrl: 'http://localhost:11434/v1',
    startHint: 'ollama serve を実行してください',
  },
] as const;

export type PresetId = (typeof PRESETS)[number]['id'];

export type Settings = {
  presetId: PresetId;
  model: string | null;
};

export const DEFAULT_SETTINGS: Settings = { presetId: 'model-runner', model: null };

export const baseUrlOf = (presetId: PresetId): string =>
  PRESETS.find((p) => p.id === presetId)!.baseUrl;
```

- [ ] **Step 2: 失敗するテストを書く**

`src/adapter/storage/settings.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '../../domain/connection';
import { loadSettings, saveSettings } from './settings';

const fakeStorage = () => {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
  };
};

describe('settings storage', () => {
  it('未保存なら既定値を返す', () => {
    expect(loadSettings(fakeStorage())).toEqual(DEFAULT_SETTINGS);
  });

  it('保存した値を読み戻せる', () => {
    const s = fakeStorage();
    saveSettings(s, { presetId: 'ollama', model: 'gemma4:e4b' });
    expect(loadSettings(s)).toEqual({ presetId: 'ollama', model: 'gemma4:e4b' });
  });

  it('壊れた JSON は既定値にフォールバックする', () => {
    const s = fakeStorage();
    s.setItem('settings', '{broken');
    expect(loadSettings(s)).toEqual(DEFAULT_SETTINGS);
  });
});
```

Run: `pnpm test` → Expected: FAIL（settings.ts が未実装）

- [ ] **Step 3: 実装**

`src/adapter/storage/settings.ts`:

```ts
import { DEFAULT_SETTINGS, PRESETS, type Settings } from '../../domain/connection';

const KEY = 'settings';

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

export function loadSettings(storage: StorageLike): Settings {
  const raw = storage.getItem(KEY);
  if (!raw) return DEFAULT_SETTINGS;
  try {
    const parsed = JSON.parse(raw) as Partial<Settings>;
    if (!PRESETS.some((p) => p.id === parsed.presetId)) return DEFAULT_SETTINGS;
    return { presetId: parsed.presetId as Settings['presetId'], model: parsed.model ?? null };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(storage: StorageLike, settings: Settings): void {
  storage.setItem(KEY, JSON.stringify(settings));
}
```

- [ ] **Step 4: テストが通ることを確認してコミット**

Run: `pnpm test && pnpm lint`
Expected: PASS

```bash
git add -A ':!docs/findings.md'
git commit -m "接続設定の共有 domain と localStorage 永続化"
```

---

### Task 5: LLM アダプタ（adapter/llm）

SSE の解釈を Web 標準ストリームで実装する。fetch は注入可能にして単体テストする。

**Files:**
- Create: `src/adapter/llm/sse.ts`, `src/adapter/llm/sse.test.ts`
- Create: `src/adapter/llm/client.ts`, `src/adapter/llm/client.test.ts`

**Interfaces:**
- Produces: `type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string }`
- Produces: `streamChat(fetchFn, config: { baseUrl; model }, messages, opts?: { signal?; onChunk?: (acc: string) => void }): Promise<string>`
- Produces: `listModels(fetchFn, baseUrl): Promise<string[]>`
- Produces: `sseEvents(): TransformStream<string, string>`, `extractDelta(event: string): string | null`
- `fetchFn` の型は `FetchLike = (url: string, init?: RequestInit) => Promise<Response>`。実行時は `@tauri-apps/plugin-http` の `fetch`

- [ ] **Step 1: SSE 分割の失敗するテストを書く**

`src/adapter/llm/sse.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { extractDelta, sseEvents } from './sse';

async function collect(chunks: string[]): Promise<string[]> {
  const out: string[] = [];
  const stream = new ReadableStream<string>({
    start(c) {
      for (const chunk of chunks) c.enqueue(chunk);
      c.close();
    },
  }).pipeThrough(sseEvents());
  const reader = stream.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    out.push(value);
  }
  return out;
}

describe('sseEvents', () => {
  it('空行区切りでイベントに分割する', async () => {
    expect(await collect(['data: a\n\ndata: b\n\n'])).toEqual(['data: a', 'data: b']);
  });

  it('イベント途中で切れたチャンクを結合する', async () => {
    expect(await collect(['data: he', 'llo\n\nda', 'ta: world\n\n'])).toEqual([
      'data: hello',
      'data: world',
    ]);
  });

  it('末尾に改行がなくても flush で出す', async () => {
    expect(await collect(['data: tail'])).toEqual(['data: tail']);
  });
});

describe('extractDelta', () => {
  it('delta.content を取り出す', () => {
    const event = `data: ${JSON.stringify({ choices: [{ delta: { content: 'こん' } }] })}`;
    expect(extractDelta(event)).toBe('こん');
  });

  it('[DONE] と壊れた JSON は null', () => {
    expect(extractDelta('data: [DONE]')).toBeNull();
    expect(extractDelta('data: {broken')).toBeNull();
  });
});
```

Run: `pnpm test` → Expected: FAIL

- [ ] **Step 2: SSE 実装**

`src/adapter/llm/sse.ts`:

```ts
export function sseEvents(): TransformStream<string, string> {
  let buffer = '';
  return new TransformStream({
    transform(chunk, controller) {
      buffer += chunk;
      const events = buffer.split('\n\n');
      buffer = events.pop() ?? '';
      for (const event of events) controller.enqueue(event);
    },
    flush(controller) {
      if (buffer.trim()) controller.enqueue(buffer);
    },
  });
}

export function extractDelta(event: string): string | null {
  for (const line of event.split('\n')) {
    if (!line.startsWith('data:')) continue;
    const data = line.slice(5).trim();
    if (!data || data === '[DONE]') continue;
    try {
      const delta: unknown = JSON.parse(data);
      const content = (delta as { choices?: { delta?: { content?: string } }[] }).choices?.[0]
        ?.delta?.content;
      return content ?? null;
    } catch {
      return null;
    }
  }
  return null;
}
```

Run: `pnpm test` → Expected: PASS

- [ ] **Step 3: クライアントの失敗するテストを書く**

`src/adapter/llm/client.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { listModels, streamChat, type FetchLike } from './client';

const sseResponse = (events: string[]): Response =>
  new Response(events.map((e) => `data: ${e}\n\n`).join(''), { status: 200 });

const deltaEvent = (content: string) => JSON.stringify({ choices: [{ delta: { content } }] });

describe('streamChat', () => {
  it('delta を連結して全文を返し、onChunk に累積を渡す', async () => {
    const fetchFn: FetchLike = async () =>
      sseResponse([deltaEvent('こん'), deltaEvent('にちは'), '[DONE]']);
    const acc: string[] = [];
    const result = await streamChat(
      fetchFn,
      { baseUrl: 'http://localhost:12434/engines/v1', model: 'm' },
      [{ role: 'user', content: 'x' }],
      { onChunk: (a) => acc.push(a) },
    );
    expect(result).toBe('こんにちは');
    expect(acc).toEqual(['こん', 'こんにちは']);
  });

  it('HTTP エラーは例外にする', async () => {
    const fetchFn: FetchLike = async () => new Response('ng', { status: 500 });
    await expect(
      streamChat(fetchFn, { baseUrl: 'http://x', model: 'm' }, []),
    ).rejects.toThrow('500');
  });
});

describe('listModels', () => {
  it('モデル ID の一覧を返す', async () => {
    const fetchFn: FetchLike = async () =>
      new Response(JSON.stringify({ data: [{ id: 'a' }, { id: 'b' }] }), { status: 200 });
    expect(await listModels(fetchFn, 'http://x')).toEqual(['a', 'b']);
  });
});
```

Run: `pnpm test` → Expected: FAIL

- [ ] **Step 4: クライアント実装**

`src/adapter/llm/client.ts`:

```ts
import { extractDelta, sseEvents } from './sse';

export type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export type LlmConfig = { baseUrl: string; model: string };

const SAMPLING = { temperature: 0.7 };

export async function streamChat(
  fetchFn: FetchLike,
  config: LlmConfig,
  messages: ChatMessage[],
  opts: { signal?: AbortSignal; onChunk?: (acc: string) => void } = {},
): Promise<string> {
  const res = await fetchFn(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: config.model,
      messages,
      stream: true,
      temperature: SAMPLING.temperature,
    }),
    signal: opts.signal,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  let acc = '';
  const reader = res
    .body!.pipeThrough(new TextDecoderStream())
    .pipeThrough(sseEvents())
    .getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    const delta = extractDelta(value);
    if (delta) {
      acc += delta;
      opts.onChunk?.(acc);
    }
  }
  return acc;
}

export async function listModels(fetchFn: FetchLike, baseUrl: string): Promise<string[]> {
  const res = await fetchFn(`${baseUrl}/models`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = (await res.json()) as { data?: { id: string }[] };
  return (json.data ?? []).map((m) => m.id);
}
```

- [ ] **Step 5: テストが通ることを確認してコミット**

Run: `pnpm test && pnpm lint`
Expected: PASS

```bash
git add -A ':!docs/findings.md'
git commit -m "OpenAI 互換 LLM アダプタ（SSE を Web 標準ストリームで解釈）"
```

---

### Task 6: 校正 domain（機械検証なし版）

プロンプト組立と整形のみ。検証・再試行は Task 9-10 で足す。プロンプト文面は事前検証で較正済みのものを土台にする。

**Files:**
- Create: `src/features/proofread/domain/prompts.ts`, `src/features/proofread/domain/prompts.test.ts`
- Create: `src/features/proofread/domain/cleanup.ts`, `src/features/proofread/domain/cleanup.test.ts`
- Create: `src/features/proofread/domain/proofread.ts`, `src/features/proofread/domain/proofread.test.ts`

**Interfaces:**
- Consumes: `ChatMessage`（Task 5）
- Produces: `type Scene = 'business' | 'casual'`, `buildMessages(text, scene): ChatMessage[]`
- Produces: `cleanup(raw: string): string`
- Produces: `type GenerateFn = (messages: ChatMessage[], opts: { signal?: AbortSignal; onChunk?: (acc: string) => void }) => Promise<string>`
- Produces: `proofread(input, scene, generate, opts?): Promise<{ proposal: string }>`（Task 10 で戻り値を拡張する）

- [ ] **Step 1: 失敗するテストを書く**

`src/features/proofread/domain/prompts.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { buildMessages } from './prompts';

describe('buildMessages', () => {
  it('system + few-shot 対 + 実入力の並びになる', () => {
    const messages = buildMessages('テスト入力', 'business');
    expect(messages[0].role).toBe('system');
    const rest = messages.slice(1);
    expect(rest.length % 2).toBe(1);
    for (let i = 0; i < rest.length - 1; i += 2) {
      expect(rest[i].role).toBe('user');
      expect(rest[i + 1].role).toBe('assistant');
    }
    expect(rest.at(-1)!.role).toBe('user');
  });

  it('実入力は区切り線のフレームで包まれる', () => {
    const last = buildMessages('テスト入力', 'business').at(-1)!;
    expect(last.content).toContain('---\nテスト入力\n---');
  });

  it('シーンで system プロンプトが変わる', () => {
    expect(buildMessages('x', 'business')[0].content).not.toBe(
      buildMessages('x', 'casual')[0].content,
    );
  });
});
```

`src/features/proofread/domain/cleanup.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { cleanup } from './cleanup';

describe('cleanup', () => {
  it('前後の空白と引用符を除く', () => {
    expect(cleanup('  「本文です。」 ')).toBe('本文です。');
  });

  it('思考タグと区切り線の残骸を除く', () => {
    expect(cleanup('<think>考え</think>\n--- 本文です。 ---')).toBe('本文です。');
  });

  it('通常の本文はそのまま', () => {
    expect(cleanup('本文です。')).toBe('本文です。');
  });
});
```

`src/features/proofread/domain/proofread.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { GenerateFn } from './proofread';
import { proofread } from './proofread';

describe('proofread（検証なし版）', () => {
  it('生成結果を整形して返す', async () => {
    const generate: GenerateFn = async () => ' 「校正済みの本文です。」 ';
    const result = await proofread('入力', 'business', generate);
    expect(result.proposal).toBe('校正済みの本文です。');
  });

  it('シーンと入力からメッセージ列を組み立てて generate に渡す', async () => {
    let received: string | undefined;
    const generate: GenerateFn = async (messages) => {
      received = messages.at(-1)!.content;
      return 'x';
    };
    await proofread('こんにちは', 'casual', generate);
    expect(received).toContain('---\nこんにちは\n---');
  });
});
```

Run: `pnpm test` → Expected: FAIL

- [ ] **Step 2: prompts.ts を実装**

```ts
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
```

- [ ] **Step 3: cleanup.ts を実装**

```ts
export const cleanup = (raw: string): string =>
  raw
    .replace(/<think(ing)?>[\s\S]*?<\/think(ing)?>/gi, '')
    .trim()
    .replace(/^---\s*/, '')
    .replace(/\s*---$/, '')
    .replace(/^["「『]|["」』]$/g, '')
    .trim();
```

- [ ] **Step 4: proofread.ts を実装**

```ts
import type { ChatMessage } from '../../../adapter/llm/client';
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
```

- [ ] **Step 5: テストが通ることを確認してコミット**

Run: `pnpm test && pnpm lint`
Expected: PASS

```bash
git add -A ':!docs/findings.md'
git commit -m "校正 domain（プロンプト組立と整形。機械検証は後続タスク）"
```

---

### Task 7: settings feature と設定画面

**Files:**
- Create: `src/features/settings/hooks/useSettings.ts`
- Create: `src/features/settings/components/SettingsForm.tsx`, `src/features/settings/components/SettingsForm.css`
- Create: `src/features/settings/index.ts`
- Modify: `src/routes/settings.tsx`

**Interfaces:**
- Consumes: `PRESETS` / `Settings` / `baseUrlOf`（Task 4）、`listModels`（Task 5）、`loadSettings` / `saveSettings`（Task 4）
- Produces: `useSettings(): { settings, save(next: Settings): void }`（内部で `localStorage` を使う）
- Produces: `<SettingsForm models={string[]} error={string | null} />`
- Produces: `src/features/settings/index.ts` が `useSettings` と `SettingsForm` のみを公開

- [ ] **Step 1: hook と公開 API**

`src/features/settings/hooks/useSettings.ts`:

```ts
import { useState } from 'react';
import { loadSettings, saveSettings } from '../../../adapter/storage/settings';
import type { Settings } from '../../../domain/connection';

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(() => loadSettings(localStorage));
  const save = (next: Settings) => {
    saveSettings(localStorage, next);
    setSettings(next);
  };
  return { settings, save };
}
```

`src/features/settings/index.ts`:

```ts
export { SettingsForm } from './components/SettingsForm';
export { useSettings } from './hooks/useSettings';
```

- [ ] **Step 2: フォームコンポーネント**

`src/features/settings/components/SettingsForm.tsx`:

```tsx
import { PRESETS, type Settings } from '../../../domain/connection';
import { useSettings } from '../hooks/useSettings';
import './SettingsForm.css';

type Props = { models: string[]; error: string | null };

export function SettingsForm({ models, error }: Props) {
  const { settings, save } = useSettings();

  const setPreset = (presetId: Settings['presetId']) => save({ presetId, model: null });
  const setModel = (model: string) => save({ ...settings, model });

  return (
    <form className="settings-form">
      <fieldset>
        <legend>接続先</legend>
        {PRESETS.map((p) => (
          <label key={p.id}>
            <input
              type="radio"
              name="preset"
              checked={settings.presetId === p.id}
              onChange={() => setPreset(p.id)}
            />
            {p.label}
          </label>
        ))}
      </fieldset>

      <fieldset>
        <legend>モデル</legend>
        {error ? (
          <p className="settings-form-error" role="alert">
            接続できません。{PRESETS.find((p) => p.id === settings.presetId)!.startHint}
          </p>
        ) : (
          <select
            value={settings.model ?? ''}
            onChange={(e) => setModel(e.currentTarget.value)}
          >
            <option value="" disabled>
              モデルを選択
            </option>
            {models.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        )}
      </fieldset>
    </form>
  );
}
```

`src/features/settings/components/SettingsForm.css`:

```css
@layer components {
  .settings-form {
    display: grid;
    gap: var(--space-2);
    padding: var(--space-2);

    & fieldset {
      border: 1px solid var(--color-border);
      border-radius: var(--radius);
      padding: var(--space-2);
      display: grid;
      gap: var(--space-1);
    }

    & .settings-form-error {
      color: var(--color-warn);
    }
  }
}
```

- [ ] **Step 3: ルートにローダーを設定**

`src/routes/settings.tsx` を置き換え:

```tsx
import { fetch as tauriFetch } from '@tauri-apps/plugin-http';
import { createFileRoute } from '@tanstack/react-router';
import { listModels } from '../adapter/llm/client';
import { loadSettings } from '../adapter/storage/settings';
import { baseUrlOf } from '../domain/connection';
import { SettingsForm } from '../features/settings';

export const Route = createFileRoute('/settings')({
  loader: async () => {
    const { presetId } = loadSettings(localStorage);
    try {
      return { models: await listModels(tauriFetch, baseUrlOf(presetId)), error: null };
    } catch (e) {
      return { models: [], error: String(e) };
    }
  },
  component: SettingsPage,
});

function SettingsPage() {
  const { models, error } = Route.useLoaderData();
  return (
    <main>
      <SettingsForm models={models} error={error} />
    </main>
  );
}
```

接続先ラジオの変更後は一覧を取り直す必要がある。`useSettings.save` の後に `router.invalidate()` を呼ぶため、`SettingsForm` に `onPresetChange?: () => void` を追加し、ルート側で `const router = useRouter()` から渡す（`import { useRouter } from '@tanstack/react-router'`）。

- [ ] **Step 4: 動作確認とコミット**

Run: `pnpm tauri dev`

確認項目:

1. Model Runner 起動中: `/settings` でモデル一覧が出て、選択が再起動後も保持される（F8 / F10）
2. 接続先を Ollama に切替: Ollama 未起動なら起動方法の案内が出る（F9）
3. `pnpm test && pnpm lint`

```bash
git add -A ':!docs/findings.md'
git commit -m "設定画面（接続先プリセット・モデル選択・未接続時の案内）"
```

---

### Task 8: proofread feature と校正画面（機械検証なしの動作確認）

このタスクの完了時点が「機械検証なしでの動作確認」のマイルストーン。

**Files:**
- Create: `src/features/proofread/hooks/useProofread.ts`
- Create: `src/features/proofread/components/ProofreadScreen.tsx`, `.css`
- Create: `src/features/proofread/components/SceneSelector.tsx`, `.css`
- Create: `src/features/proofread/components/ProposalView.tsx`, `.css`
- Create: `src/features/proofread/components/CopyButton.tsx`, `.css`
- Create: `src/features/proofread/index.ts`
- Modify: `src/routes/index.tsx`

**Interfaces:**
- Consumes: `proofread` / `GenerateFn` / `Scene`（Task 6）、`streamChat`（Task 5）、`useSettings`（Task 7 の `loadSettings` 相当）
- Produces: `<ProofreadScreen generate={GenerateFn | null} />`（`null` はモデル未選択を表す）
- Produces: `useProofread(generate): { phase: 'idle' | 'running'; proposal: string; run(input, scene): void; cancel(): void }`

- [ ] **Step 1: hook**

`src/features/proofread/hooks/useProofread.ts`:

```ts
import { useRef, useState } from 'react';
import { proofread } from '../domain/proofread';
import type { GenerateFn } from '../domain/proofread';
import type { Scene } from '../domain/prompts';

export function useProofread(generate: GenerateFn) {
  const [phase, setPhase] = useState<'idle' | 'running'>('idle');
  const [proposal, setProposal] = useState('');
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const run = async (input: string, scene: Scene) => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setPhase('running');
    setProposal('');
    setError(null);
    try {
      const result = await proofread(input, scene, generate, {
        signal: ac.signal,
        onChunk: setProposal,
      });
      setProposal(result.proposal);
    } catch (e) {
      if (!ac.signal.aborted) setError(String(e));
    } finally {
      if (abortRef.current === ac) setPhase('idle');
    }
  };

  const cancel = () => abortRef.current?.abort();

  return { phase, proposal, error, run, cancel };
}
```

- [ ] **Step 2: コンポーネント**

`src/features/proofread/components/SceneSelector.tsx`:

```tsx
import type { Scene } from '../domain/prompts';
import './SceneSelector.css';

const SCENES: { id: Scene; label: string }[] = [
  { id: 'business', label: 'ビジネス' },
  { id: 'casual', label: 'カジュアル' },
];

type Props = { value: Scene; onChange: (scene: Scene) => void };

export function SceneSelector({ value, onChange }: Props) {
  return (
    <div className="scene-selector" role="radiogroup" aria-label="シーン">
      {SCENES.map((s) => (
        <button
          key={s.id}
          type="button"
          role="radio"
          aria-checked={value === s.id}
          onClick={() => onChange(s.id)}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
```

`SceneSelector.css`:

```css
@layer components {
  .scene-selector {
    display: inline-flex;
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    overflow: hidden;

    & button {
      border: none;
      background: transparent;
      padding: var(--space-1) var(--space-2);
      cursor: pointer;

      &[aria-checked='true'] {
        background: var(--color-accent);
        color: white;
      }
    }
  }
}
```

`src/features/proofread/components/CopyButton.tsx`:

```tsx
import { useRef } from 'react';
import './CopyButton.css';

type Props = { text: string; disabled: boolean };

export function CopyButton({ text, disabled }: Props) {
  const toastRef = useRef<HTMLDivElement>(null);

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    toastRef.current?.showPopover();
    setTimeout(() => toastRef.current?.hidePopover(), 1500);
  };

  return (
    <>
      <button type="button" className="copy-button" disabled={disabled} onClick={copy}>
        コピー
      </button>
      <div ref={toastRef} className="copy-toast" popover="manual">
        コピーしました
      </div>
    </>
  );
}
```

`CopyButton.css`（CSS Anchor Positioning）:

```css
@layer components {
  .copy-button {
    anchor-name: --copy-button;
  }

  .copy-toast {
    position-anchor: --copy-button;
    position-area: top;
    margin-bottom: var(--space-1);
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    padding: var(--space-1) var(--space-2);
    background: var(--color-bg);
  }
}
```

WKWebView が Anchor Positioning 未対応だった場合はこのタスクを止めず、`position-fixed` での画面隅表示に落として、未対応だった事実をユーザーに報告する。

`src/features/proofread/components/ProposalView.tsx`:

```tsx
import './ProposalView.css';

type Props = { proposal: string; running: boolean; error: string | null };

export function ProposalView({ proposal, running, error }: Props) {
  return (
    <section className="proposal-view" aria-live="polite">
      {error ? (
        <p className="proposal-view-error" role="alert">
          {error}
        </p>
      ) : (
        <p className="proposal-view-text">{proposal || (running ? '生成中…' : '')}</p>
      )}
    </section>
  );
}
```

`ProposalView.css`:

```css
@layer components {
  .proposal-view {
    container-type: inline-size;
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    padding: var(--space-2);
    min-height: 6lh;

    & .proposal-view-text {
      white-space: pre-wrap;
    }

    & .proposal-view-error {
      color: var(--color-warn);
    }
  }
}
```

`src/features/proofread/components/ProofreadScreen.tsx`:

```tsx
import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import type { GenerateFn } from '../domain/proofread';
import type { Scene } from '../domain/prompts';
import { useProofread } from '../hooks/useProofread';
import { CopyButton } from './CopyButton';
import { ProposalView } from './ProposalView';
import { SceneSelector } from './SceneSelector';
import './ProofreadScreen.css';

type Props = { generate: GenerateFn | null };

export function ProofreadScreen({ generate }: Props) {
  const [input, setInput] = useState('');
  const [scene, setScene] = useState<Scene>('business');

  if (!generate) {
    return (
      <main className="proofread-screen">
        <p>
          モデルが未選択です。<Link to="/settings">設定</Link>で接続先とモデルを選んでください。
        </p>
      </main>
    );
  }
  return <Inner generate={generate} {...{ input, setInput, scene, setScene }} />;
}

type InnerProps = {
  generate: GenerateFn;
  input: string;
  setInput: (v: string) => void;
  scene: Scene;
  setScene: (s: Scene) => void;
};

function Inner({ generate, input, setInput, scene, setScene }: InnerProps) {
  const { phase, proposal, error, run, cancel } = useProofread(generate);
  const running = phase === 'running';

  return (
    <main className="proofread-screen">
      <SceneSelector value={scene} onChange={setScene} />
      <textarea
        value={input}
        onChange={(e) => setInput(e.currentTarget.value)}
        placeholder="校正したいメッセージを貼り付け"
        rows={5}
      />
      {running ? (
        <button type="button" onClick={cancel}>
          中断
        </button>
      ) : (
        <button type="button" disabled={!input.trim()} onClick={() => run(input, scene)}>
          校正する
        </button>
      )}
      <ProposalView proposal={proposal} running={running} error={error} />
      <CopyButton text={proposal} disabled={running || !proposal} />
    </main>
  );
}
```

`ProofreadScreen.css`:

```css
@layer components {
  .proofread-screen {
    display: grid;
    gap: var(--space-2);
    padding: var(--space-2);
    max-width: 40rem;
    margin-inline: auto;

    & textarea {
      font: inherit;
      padding: var(--space-1);
      border: 1px solid var(--color-border);
      border-radius: var(--radius);
      resize: vertical;
    }
  }
}
```

`src/features/proofread/index.ts`:

```ts
export { ProofreadScreen } from './components/ProofreadScreen';
export type { GenerateFn } from './domain/proofread';
```

- [ ] **Step 3: ルートで DI して組み立てる**

`src/routes/index.tsx` を置き換え:

```tsx
import { fetch as tauriFetch } from '@tauri-apps/plugin-http';
import { createFileRoute } from '@tanstack/react-router';
import { streamChat } from '../adapter/llm/client';
import { loadSettings } from '../adapter/storage/settings';
import { baseUrlOf } from '../domain/connection';
import { ProofreadScreen, type GenerateFn } from '../features/proofread';

export const Route = createFileRoute('/')({
  loader: () => loadSettings(localStorage),
  component: IndexPage,
});

function IndexPage() {
  const settings = Route.useLoaderData();
  const generate: GenerateFn | null = settings.model
    ? (messages, opts) =>
        streamChat(
          tauriFetch,
          { baseUrl: baseUrlOf(settings.presetId), model: settings.model! },
          messages,
          opts,
        )
    : null;
  return <ProofreadScreen generate={generate} />;
}
```

- [ ] **Step 4: 機械検証なしの動作確認（マイルストーン）**

Run: `pnpm tauri dev`

確認項目（requirements.md §8 のうち機械検証に依存しないもの）:

1. メッセージを貼って「校正する」→ 数秒で校正案が逐次表示される
2. もう一度「校正する」→ 別の案が出る（temperature 0.7 の多様性のみで。同一案の不合格化は Task 9）
3. シーンを切り替えると文体が変わる（ビジネス/カジュアルの差を目視確認）
4. 生成中に「中断」→ 止まる。エラー表示にならない
5. 「コピー」→ クリップボードに入り、Popover が出る
6. モデル未選択（localStorage を消して再起動）→ 設定への誘導が出る

**結果（特にシーン別の文体品質）をユーザーに報告し、プロンプト調整の要否を確認する。**

- [ ] **Step 5: コミット**

```bash
git add -A ':!docs/findings.md'
git commit -m "校正画面（機械検証なしで一連の操作が動く状態）"
```

---

### Task 9: 機械検証（validate.ts）— 見送り

> **2026-08-18 に見送りを決定。** Task 8 完了時点の実機確認で、機械検証なしでも Gemma 4 E4B の精度が実用水準に達していたため実装しない。
> `docs/requirements.md` §6 でスコープ外として記録済み。以下は判断を覆す場合のための記録。


事前検証で較正済みのロジックとしきい値を移植し、直前案との同一判定を加える。

**Files:**
- Create: `src/features/proofread/domain/validate.ts`, `src/features/proofread/domain/validate.test.ts`

**Interfaces:**
- Produces: `validateProposal(original: string, proposal: string, previousProposal?: string): string | null`（合格なら `null`、不合格なら理由）
- Produces: `VALIDATION = { maxAttempts: 3, minLenRatio: 0.4, maxLenRatio: 1.5, maxInsertedRatio: 0.6, lcsMaxChars: 2000 }`

- [ ] **Step 1: 失敗するテストを書く**

`src/features/proofread/domain/validate.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { validateProposal } from './validate';

const original =
  'ありがとうございます！ さっそく共有します！ また、別件ですが、C社の請求書ですが、送付済みかと思いますが、入金が確認できません。。。 経理側で何か止まっているのでしょうか。。';

describe('validateProposal', () => {
  it('正当な校正案は合格する', () => {
    const proposal =
      'ありがとうございます！さっそく共有します。別件ですが、C社の請求書は送付済みかと思います。ただ、入金が確認できません。経理側で何か止まっているのでしょうか。';
    expect(validateProposal(original, proposal)).toBeNull();
  });

  it('メッセージへの返事は不合格になる', () => {
    const reply =
      '承知しました。ご心配のことと思います。経理の状況をこちらでも確認して、分かり次第、改めてご連絡いたします。少々お待ちください。';
    expect(validateProposal(original, reply)).not.toBeNull();
  });

  it('原文の疑問が消えたら不合格になる', () => {
    const proposal =
      'ありがとうございます！さっそく共有します。別件ですが、C社の請求書は送付済みかと思いますが、入金が確認できません。経理側で何か止まっているのだと思います。';
    expect(validateProposal(original, proposal)).not.toBeNull();
  });

  it('大幅に短い案は不合格になる', () => {
    expect(validateProposal(original, 'ありがとうございます。')).not.toBeNull();
  });

  it('直前の案と同一なら不合格になる', () => {
    const proposal =
      'ありがとうございます！さっそく共有します。別件ですが、C社の請求書は送付済みかと思います。ただ、入金が確認できません。経理側で何か止まっているのでしょうか。';
    expect(validateProposal(original, proposal, proposal)).not.toBeNull();
    expect(validateProposal(original, proposal, '別の案')).toBeNull();
  });
});
```

Run: `pnpm test` → Expected: FAIL

- [ ] **Step 2: 実装**

`src/features/proofread/domain/validate.ts`:

```ts
export const VALIDATION = {
  maxAttempts: 3,
  minLenRatio: 0.4,
  maxLenRatio: 1.5,
  maxInsertedRatio: 0.6,
  lcsMaxChars: 2000,
} as const;

function lcsLength(a: string[], b: string[]): number {
  let prev = new Array<number>(b.length + 1).fill(0);
  for (let i = 1; i <= a.length; i++) {
    const cur: number[] = [0];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = a[i - 1] === b[j - 1] ? prev[j - 1] + 1 : Math.max(prev[j], cur[j - 1]);
    }
    prev = cur;
  }
  return prev[b.length];
}

const hasQuestion = (s: string): boolean =>
  /[?？]/.test(s) || s.split(/[。．.!！\n]/).some((t) => /か\s*$/.test(t.trim()));

export function validateProposal(
  original: string,
  proposal: string,
  previousProposal?: string,
): string | null {
  if (!proposal) return '校正案が空';
  if (previousProposal && proposal === previousProposal) return '直前の案と同一';
  const o = [...original];
  const p = [...proposal];
  const ratio = p.length / o.length;
  if (ratio > VALIDATION.maxLenRatio) return '原文より大幅に長い';
  if (ratio < VALIDATION.minLenRatio) return '原文より大幅に短い';
  if (hasQuestion(original) && !hasQuestion(proposal)) return '原文の質問が消えている';
  if (!hasQuestion(original) && /[?？]/.test(proposal)) return '原文にない質問が増えている';
  if (o.length <= VALIDATION.lcsMaxChars && p.length <= VALIDATION.lcsMaxChars) {
    const inserted = p.length - lcsLength(o, p);
    if (inserted / p.length > VALIDATION.maxInsertedRatio) return '原文にない内容が多い';
  }
  return null;
}
```

- [ ] **Step 3: テストが通ることを確認してコミット**

Run: `pnpm test && pnpm lint`
Expected: PASS

```bash
git add -A ':!docs/findings.md'
git commit -m "機械検証（長さ比・疑問の保存・新規文字比率・直前案との同一判定）"
```

---

### Task 10: 再試行の統合と注意書き表示 — 見送り

> **Task 9 に依存するため同時に見送り。** 内容がすべて機械検証の統合であり、Task 9 なしでは成立しない。
> 代わりに、レビューで積み残していた修正 3 件（アンマウント時の abort、`generate` の `useMemo` 化、`setTimeout` のクリア）を実施した。


**Files:**
- Modify: `src/features/proofread/domain/proofread.ts`, `proofread.test.ts`
- Modify: `src/features/proofread/hooks/useProofread.ts`
- Modify: `src/features/proofread/components/ProposalView.tsx`, `ProofreadScreen.tsx`

**Interfaces:**
- Produces（変更）: `proofread(input, scene, generate, opts?: { signal?; onChunk?; onRetry?: (attempt: number) => void; previousProposal?: string }): Promise<{ proposal: string; passed: boolean; attempts: number }>`
- Produces（変更）: `useProofread` の戻りに `passed: boolean`、`retrying: boolean` を追加

- [ ] **Step 1: proofread のテストを再試行版に更新**

`src/features/proofread/domain/proofread.test.ts` に追記:

```ts
const LONG_INPUT =
  '本日はお時間をいただきありがとうございました。いただいた内容を持ち帰って検討し、来週までにご連絡します。';
const OK_PROPOSAL =
  '本日はお時間をいただきありがとうございました。内容を持ち帰って検討し、来週までにご連絡します。';
const BAD_PROPOSAL = '了解';

describe('proofread（再試行）', () => {
  it('不合格なら再試行し、合格案を返す', async () => {
    const outputs = [BAD_PROPOSAL, OK_PROPOSAL];
    const generate: GenerateFn = async () => outputs.shift()!;
    const retries: number[] = [];
    const result = await proofread(LONG_INPUT, 'business', generate, {
      onRetry: (n) => retries.push(n),
    });
    expect(result).toEqual({ proposal: OK_PROPOSAL, passed: true, attempts: 2 });
    expect(retries).toEqual([2]);
  });

  it('上限まで不合格なら最後の案を passed: false で返す', async () => {
    const generate: GenerateFn = async () => BAD_PROPOSAL;
    const result = await proofread(LONG_INPUT, 'business', generate);
    expect(result).toEqual({ proposal: BAD_PROPOSAL, passed: false, attempts: 3 });
  });

  it('直前案と同一の出力は不合格として再試行される', async () => {
    const outputs = [OK_PROPOSAL, OK_PROPOSAL.replace('検討し', '検討して')];
    const generate: GenerateFn = async () => outputs.shift()!;
    const result = await proofread(LONG_INPUT, 'business', generate, {
      previousProposal: OK_PROPOSAL,
    });
    expect(result.passed).toBe(true);
    expect(result.attempts).toBe(2);
  });
});
```

既存の「検証なし版」テストのうち、戻り値の形が変わるものは `{ proposal }` の部分一致（`expect(result.proposal).toBe(...)`）に直す。

Run: `pnpm test` → Expected: FAIL

- [ ] **Step 2: proofread.ts を再試行版に更新**

```ts
import type { ChatMessage } from '../../../adapter/llm/client';
import { cleanup } from './cleanup';
import { buildMessages, type Scene } from './prompts';
import { validateProposal, VALIDATION } from './validate';

export type GenerateFn = (
  messages: ChatMessage[],
  opts: { signal?: AbortSignal; onChunk?: (acc: string) => void },
) => Promise<string>;

export type ProofreadResult = { proposal: string; passed: boolean; attempts: number };

export async function proofread(
  input: string,
  scene: Scene,
  generate: GenerateFn,
  opts: {
    signal?: AbortSignal;
    onChunk?: (acc: string) => void;
    onRetry?: (attempt: number) => void;
    previousProposal?: string;
  } = {},
): Promise<ProofreadResult> {
  let last = '';
  for (let attempt = 1; attempt <= VALIDATION.maxAttempts; attempt++) {
    if (attempt > 1) opts.onRetry?.(attempt);
    const raw = await generate(buildMessages(input, scene), {
      signal: opts.signal,
      onChunk: opts.onChunk,
    });
    last = cleanup(raw);
    if (validateProposal(input, last, opts.previousProposal) === null) {
      return { proposal: last, passed: true, attempts: attempt };
    }
  }
  return { proposal: last, passed: false, attempts: VALIDATION.maxAttempts };
}
```

Run: `pnpm test` → Expected: PASS

- [ ] **Step 3: hook と UI に反映**

`useProofread.ts` の変更点:

- state に `passed`（boolean、初期値 true）と `retrying`（boolean、初期値 false）を追加
- 直前の合格案を `useRef<string | undefined>` に保持し、**同じ入力・同じシーンでの再実行時のみ** `previousProposal` として渡す（入力かシーンが変わったらリセット）
- `proofread(...)` 呼び出しに `onRetry: () => { setRetrying(true); setProposal(''); }` を渡し、完了時に `setRetrying(false)`、`setPassed(result.passed)`

`ProposalView.tsx` の変更点:

- Props に `retrying: boolean` と `passed: boolean` を追加
- `retrying` の間は「再試行中…」を表示
- `!passed` のとき注意書きを表示:

```tsx
{!passed && (
  <p className="proposal-view-warn" role="alert">
    ⚠ 自動検証を通過していません。原文と見比べて確認してください。
  </p>
)}
```

`ProposalView.css` に追記:

```css
& .proposal-view-warn {
  color: var(--color-warn);
}
```

`ProofreadScreen.tsx` は `useProofread` の新しい戻り値を `ProposalView` に渡すだけ。

- [ ] **Step 4: 動作確認とコミット**

Run: `pnpm tauri dev` → 通常の校正が今までどおり動き、同じ入力の連続実行で別案が返ること。`pnpm test && pnpm lint`

```bash
git add -A ':!docs/findings.md'
git commit -m "機械検証と再試行を校正フローに統合"
```

---

### Task 11: 接続状態表示と受け入れ確認

**Files:**
- Create: `src/components/ConnectionStatus.tsx`, `src/components/ConnectionStatus.css`
- Modify: `src/routes/__root.tsx`

**Interfaces:**
- Consumes: `listModels`（Task 5）、`loadSettings` / `baseUrlOf`（Task 4）
- Produces: `<ConnectionStatus />`（ヘッダーに常駐。接続 OK / NG を表示）

- [ ] **Step 1: 接続状態コンポーネント**

`src/components/ConnectionStatus.tsx`:

```tsx
import { fetch as tauriFetch } from '@tauri-apps/plugin-http';
import { useEffect, useState } from 'react';
import { listModels } from '../adapter/llm/client';
import { loadSettings } from '../adapter/storage/settings';
import { baseUrlOf } from '../domain/connection';
import './ConnectionStatus.css';

export function ConnectionStatus() {
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    const check = async () => {
      try {
        await listModels(tauriFetch, baseUrlOf(loadSettings(localStorage).presetId));
        setOk(true);
      } catch {
        setOk(false);
      }
    };
    check();
    const timer = setInterval(check, 15_000);
    return () => clearInterval(timer);
  }, []);

  if (ok === null) return null;
  return (
    <span className="connection-status" data-ok={ok}>
      {ok ? '接続中' : '未接続'}
    </span>
  );
}
```

`ConnectionStatus.css`:

```css
@layer components {
  .connection-status {
    font-size: 0.85em;
    padding: 2px var(--space-1);
    border-radius: var(--radius);
    border: 1px solid var(--color-border);

    &[data-ok='false'] {
      color: var(--color-warn);
    }
  }
}
```

`src/routes/__root.tsx` のヘッダーに `<ConnectionStatus />` を追加し、ヘッダー用の CSS（`.app-header` の flex 配置）を `src/components/AppHeader.css` として切り出すか `global.css` の components レイヤーに置く。

- [ ] **Step 2: 受け入れ確認（requirements.md §8 の全項目）**

Run: `pnpm tauri dev`

1. Model Runner 起動中にメッセージを貼りシーンを選ぶ → 数秒で校正案が表示される
2. もう一度校正すると別の案が出る
3. 設定画面で Ollama に切り替えても同じ操作が動く（Ollama を起動して確認）
4. ランタイム停止中はエラーではなく状態と対処方法が表示される
5. 通信先が localhost 以外に存在しない（capability の scope と CSP を再確認。`src-tauri/capabilities/default.json` と `tauri.conf.json` を目視）

結果をユーザーに報告する。

- [ ] **Step 3: CLAUDE.md 更新とコミット**

`CLAUDE.md` の「現在のフェーズ」を「実装完了。動作確認済み」に更新。

```bash
git add -A ':!docs/findings.md'
git commit -m "接続状態表示と受け入れ確認"
```

---

## 補足: 意図的に後回し・除外したもの

- シーン別プロンプトの品質調整: Task 8 の動作確認後にユーザーと相談して行う（実測が必要なため計画に固定手順を書かない）
- `pnpm tauri build`（配布用ビルド）: 開発中は `tauri dev` で足りる。必要になったら行う
- README: リポジトリ公開時の体裁はユーザーの判断に委ねる
