import { Link } from '@tanstack/react-router';
import type { ProofreadError } from '../hooks/useProofreadPage';
import './ProofreadErrorView.css';

type Props = { error: ProofreadError; llmStartHint: string };

export function ProofreadErrorView({ error, llmStartHint }: Props) {
  return (
    <section className="proofread-error-view" role="alert">
      {error.kind === 'unreachable' ? (
        <>
          <p className="proofread-error-view-state">接続できません。</p>
          <p>{llmStartHint}</p>
          <p>
            接続先は<Link to="/settings">設定</Link>で変更できます。
          </p>
        </>
      ) : (
        <>
          <p className="proofread-error-view-state">{error.message}</p>
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
