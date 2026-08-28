import './GeneratedTextView.css';

type Props = {
  generatedText: string;
  running: boolean;
  /** 生成前の空欄に出す文言。空欄がただの余白に見えないようにする。 */
  placeholder: string;
};

export function GeneratedTextView({ generatedText, running, placeholder }: Props) {
  return (
    <section className="generated-text-view" aria-live="polite" aria-busy={running}>
      <p className="generated-text-view-text" data-placeholder={placeholder}>
        {generatedText || (running ? '生成中…' : '')}
      </p>
    </section>
  );
}
