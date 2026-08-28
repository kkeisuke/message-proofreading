import { Link } from '@tanstack/react-router';
import type { GenerationError } from '../hooks/useGeneration';
import styles from './GenerationErrorView.module.css';

type Props = { error: GenerationError; llmStartHint: string };

export function GenerationErrorView({ error, llmStartHint }: Props) {
  return (
    <section className={styles.generationErrorView} role="alert">
      {error.kind === 'unreachable' ? (
        <>
          <p className={styles.generationErrorViewState}>接続できません。</p>
          <p>{llmStartHint}</p>
          <p>
            接続先は<Link to="/settings">設定</Link>で変更できます。
          </p>
        </>
      ) : (
        <>
          <p className={styles.generationErrorViewState}>{error.message}</p>
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
