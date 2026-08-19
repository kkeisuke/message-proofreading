import { Link } from '@tanstack/react-router';
import type { ProofreadError } from '../hooks/useProofread';
import './ProposalView.css';

type Props = {
  proposal: string;
  running: boolean;
  error: ProofreadError | null;
  startHint: string;
};

export function ProposalView({ proposal, running, error, startHint }: Props) {
  return (
    <section className="proposal-view" aria-live="polite" aria-busy={running}>
      {error ? (
        <div className="proposal-view-error" role="alert">
          {error.kind === 'unreachable' ? (
            <>
              <p className="proposal-view-error-state">接続できません。</p>
              <p>{startHint}</p>
              <p>
                接続先は<Link to="/settings">設定</Link>で変更できます。
              </p>
            </>
          ) : (
            <>
              <p className="proposal-view-error-state">{error.message}</p>
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
        <p className="proposal-view-text">{proposal || (running ? '生成中…' : '')}</p>
      )}
    </section>
  );
}
