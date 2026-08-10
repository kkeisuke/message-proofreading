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
