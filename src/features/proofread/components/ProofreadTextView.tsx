import { Link } from '@tanstack/react-router';
import type { ProofreadError } from '../hooks/useProofread';
import './ProofreadTextView.css';

type Props = {
  proofreadText: string;
  running: boolean;
  error: ProofreadError | null;
  llmStartHint: string;
};

export function ProofreadTextView({ proofreadText, running, error, llmStartHint }: Props) {
  return (
    <section className="proofread-text-view" aria-live="polite" aria-busy={running}>
      {error ? (
        <div className="proofread-text-view-error" role="alert">
          {error.kind === 'unreachable' ? (
            <>
              <p className="proofread-text-view-error-state">接続できません。</p>
              <p>{llmStartHint}</p>
              <p>
                接続先は<Link to="/settings">設定</Link>で変更できます。
              </p>
            </>
          ) : (
            <>
              <p className="proofread-text-view-error-state">{error.message}</p>
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
        </div>
      ) : (
        <p className="proofread-text-view-text">{proofreadText || (running ? '生成中…' : '')}</p>
      )}
    </section>
  );
}
