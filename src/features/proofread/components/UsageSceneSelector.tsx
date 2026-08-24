import type { UsageScene } from '../domain/prompts';
import './UsageSceneSelector.css';

const USAGE_SCENES: { id: UsageScene; label: string }[] = [
  { id: 'business', label: 'ビジネス' },
  { id: 'casual', label: 'カジュアル' },
];

type Props = { value: UsageScene; onChange: (usageScene: UsageScene) => void };

export function UsageSceneSelector({ value, onChange }: Props) {
  return (
    <div className="usage-scene-selector" role="radiogroup" aria-label="利用シーン">
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
