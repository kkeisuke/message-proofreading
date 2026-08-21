import './ProofreadTextView.css';

type Props = { proofreadText: string; running: boolean };

export function ProofreadTextView({ proofreadText, running }: Props) {
  return (
    <section className="proofread-text-view" aria-live="polite" aria-busy={running}>
      <p className="proofread-text-view-text">{proofreadText || (running ? '生成中…' : '')}</p>
    </section>
  );
}
