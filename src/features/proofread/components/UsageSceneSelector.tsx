import type { UsageScene } from '../domain/prompts';
import './UsageSceneSelector.css';

const USAGE_SCENES: { id: UsageScene; label: string }[] = [
  { id: 'business', label: 'ビジネス' },
  { id: 'casual', label: 'カジュアル' },
];

type Props = { value: UsageScene; onChange: (scene: UsageScene) => void };

export function UsageSceneSelector({ value, onChange }: Props) {
  return (
    <div className="usage-scene-selector" role="radiogroup" aria-label="シーン">
      {USAGE_SCENES.map((s) => (
        <label key={s.id}>
          <input
            type="radio"
            name="scene"
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
