import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import type { GenerateFn } from '../domain/proofread';
import type { UsageScene } from '../domain/prompts';
import { useProofread } from '../hooks/useProofread';
import { CopyButton } from './CopyButton';
import { ProofreadTextView } from './ProofreadTextView';
import { UsageSceneSelector } from './UsageSceneSelector';
import './ProofreadPage.css';

type Props = { generate: GenerateFn | null; llmStartHint: string };

export function ProofreadPage({ generate, llmStartHint }: Props) {
  const [input, setInput] = useState('');
  const [scene, setUsageScene] = useState<UsageScene>('business');

  if (!generate) {
    return (
      <main className="proofread-page">
        <p>
          モデルが未選択です。<Link to="/settings">設定</Link>で接続先とモデルを選んでください。
        </p>
      </main>
    );
  }
  return (
    <Inner
      generate={generate}
      llmStartHint={llmStartHint}
      {...{ input, setInput, scene, setUsageScene }}
    />
  );
}

type InnerProps = {
  generate: GenerateFn;
  llmStartHint: string;
  input: string;
  setInput: (v: string) => void;
  scene: UsageScene;
  setUsageScene: (s: UsageScene) => void;
};

function Inner({ generate, llmStartHint, input, setInput, scene, setUsageScene }: InnerProps) {
  const { phase, proofreadText, error, run, cancel } = useProofread(generate);
  const running = phase === 'running';

  return (
    <main className="proofread-page">
      <UsageSceneSelector value={scene} onChange={setUsageScene} />
      <textarea
        value={input}
        onChange={(e) => setInput(e.currentTarget.value)}
        placeholder="校正したいメッセージを貼り付け"
        rows={5}
      />
      {running ? (
        <button type="button" onClick={cancel}>
          中断
        </button>
      ) : (
        <button type="button" disabled={!input.trim()} onClick={() => run(input.trim(), scene)}>
          校正する
        </button>
      )}
      <ProofreadTextView
        proofreadText={proofreadText}
        running={running}
        error={error}
        llmStartHint={llmStartHint}
      />
      <CopyButton text={proofreadText} disabled={running || !proofreadText} />
    </main>
  );
}
