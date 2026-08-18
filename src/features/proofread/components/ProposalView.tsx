import { Link } from '@tanstack/react-router';
import './ProposalView.css';

type Props = { proposal: string; running: boolean; error: string | null; startHint: string };

export function ProposalView({ proposal, running, error, startHint }: Props) {
  return (
    <section className="proposal-view" aria-live="polite">
      {error ? (
        <div className="proposal-view-error" role="alert">
          <p className="proposal-view-error-state">接続できません。</p>
          <p>{startHint}</p>
          <p>
            接続先は<Link to="/settings">設定</Link>で変更できます。
          </p>
          <details>
            <summary>エラーの詳細</summary>
            <pre>{error}</pre>
          </details>
        </div>
      ) : (
        <p className="proposal-view-text">{proposal || (running ? '生成中…' : '')}</p>
      )}
    </section>
  );
}
