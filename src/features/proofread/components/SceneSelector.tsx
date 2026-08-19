import type { Scene } from '../domain/prompts';
import './SceneSelector.css';

const SCENES: { id: Scene; label: string }[] = [
  { id: 'business', label: 'ビジネス' },
  { id: 'casual', label: 'カジュアル' },
];

type Props = { value: Scene; onChange: (scene: Scene) => void };

export function SceneSelector({ value, onChange }: Props) {
  return (
    <div className="scene-selector" role="radiogroup" aria-label="シーン">
      {SCENES.map((s) => (
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
