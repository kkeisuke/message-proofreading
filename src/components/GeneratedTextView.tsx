import styles from './GeneratedTextView.module.css';

type Props = {
  generatedText: string;
  running: boolean;
  /** 生成前の空欄に出す文言。空欄がただの余白に見えないようにする。 */
  placeholder: string;
};

export function GeneratedTextView({ generatedText, running, placeholder }: Props) {
  return (
    <section className={styles.generatedTextView} aria-live="polite" aria-busy={running}>
      <p className={styles.generatedTextViewText} data-placeholder={placeholder}>
        {generatedText || (running ? '生成中…' : '')}
      </p>
    </section>
  );
}
