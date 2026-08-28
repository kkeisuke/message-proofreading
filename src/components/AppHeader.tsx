import { Link } from '@tanstack/react-router';
import { ConnectionStatus } from './ConnectionStatus';
import styles from './AppHeader.module.css';

type Props = { llmRuntimeLabel: string };

export function AppHeader({ llmRuntimeLabel }: Props) {
  return (
    <header className={styles.appHeader}>
      <nav className={styles.appHeaderNav}>
        {/* exact を付けないと、設定画面にいる間も「校正」が現在地になる。 */}
        <Link to="/" activeOptions={{ exact: true }}>
          校正
        </Link>
        <Link to="/reply">返信</Link>
        <Link to="/settings">設定</Link>
      </nav>
      <ConnectionStatus llmRuntimeLabel={llmRuntimeLabel} />
    </header>
  );
}
