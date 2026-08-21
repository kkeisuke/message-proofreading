import { Link } from '@tanstack/react-router';
import './ModelNotSelectedView.css';

export function ModelNotSelectedView() {
  return (
    <main className="model-not-selected-view">
      <p>
        モデルが未選択です。<Link to="/settings">設定</Link>で接続先とモデルを選んでください。
      </p>
    </main>
  );
}
