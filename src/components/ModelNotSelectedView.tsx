import { Link } from '@tanstack/react-router';
import styles from './ModelNotSelectedView.module.css';

export function ModelNotSelectedView() {
  return (
    <main className={styles.modelNotSelectedView}>
      <p>
        モデルが未選択です。<Link to="/settings">設定</Link>で接続先とモデルを選んでください。
      </p>
    </main>
  );
}
