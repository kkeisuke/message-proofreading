import { Link } from '@tanstack/react-router';
import type { GenerationError } from '../hooks/useGeneration';
import './GenerationErrorView.css';

type Props = { error: GenerationError; llmStartHint: string };

export function GenerationErrorView({ error, llmStartHint }: Props) {
  return (
    <section className="generation-error-view" role="alert">
      {error.kind === 'unreachable' ? (
        <>
          <p className="generation-error-view-state">接続できません。</p>
          <p>{llmStartHint}</p>
          <p>
            接続先は<Link to="/settings">設定</Link>で変更できます。
          </p>
        </>
      ) : (
        <>
          <p className="generation-error-view-state">{error.message}</p>
          {error.kind === 'model-not-found' ? (
            <p>
              モデル名は<Link to="/settings">設定</Link>で確認できます。
            </p>
          ) : null}
        </>
      )}
      <details>
        <summary>エラーの詳細</summary>
        <pre>{error.raw}</pre>
      </details>
    </section>
  );
}
