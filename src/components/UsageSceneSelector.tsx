import { USAGE_SCENES, type UsageScene } from '../domain/usageScene';
import styles from './UsageSceneSelector.module.css';

type Props = { value: UsageScene; onChange: (usageScene: UsageScene) => void };

export function UsageSceneSelector({ value, onChange }: Props) {
  return (
    <div className={styles.usageSceneSelector} role="radiogroup" aria-label="利用シーン">
      {USAGE_SCENES.map((s) => (
        <label key={s.id}>
          <input
            type="radio"
            name="usage-scene"
            value={s.id}
            checked={value === s.id}
            onChange={() => onChange(s.id)}
          />
          {s.label}
        </label>
      ))}
    </div>
  );
}
