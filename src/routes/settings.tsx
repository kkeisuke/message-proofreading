import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/settings')({
  component: () => <main>設定画面（Task 7 で実装）</main>,
});
