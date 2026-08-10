import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import type { GenerateFn } from '../domain/proofread';
import type { Scene } from '../domain/prompts';
import { useProofread } from '../hooks/useProofread';
import { CopyButton } from './CopyButton';
import { ProposalView } from './ProposalView';
import { SceneSelector } from './SceneSelector';
import './ProofreadScreen.css';

type Props = { generate: GenerateFn | null };

export function ProofreadScreen({ generate }: Props) {
  const [input, setInput] = useState('');
  const [scene, setScene] = useState<Scene>('business');

  if (!generate) {
    return (
      <main className="proofread-screen">
        <p>
          モデルが未選択です。<Link to="/settings">設定</Link>で接続先とモデルを選んでください。
        </p>
      </main>
    );
  }
  return <Inner generate={generate} {...{ input, setInput, scene, setScene }} />;
}

type InnerProps = {
  generate: GenerateFn;
  input: string;
  setInput: (v: string) => void;
  scene: Scene;
  setScene: (s: Scene) => void;
};

function Inner({ generate, input, setInput, scene, setScene }: InnerProps) {
  const { phase, proposal, error, run, cancel } = useProofread(generate);
  const running = phase === 'running';

  return (
    <main className="proofread-screen">
      <SceneSelector value={scene} onChange={setScene} />
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
        <button type="button" disabled={!input.trim()} onClick={() => run(input, scene)}>
          校正する
        </button>
      )}
      <ProposalView proposal={proposal} running={running} error={error} />
      <CopyButton text={proposal} disabled={running || !proposal} />
    </main>
  );
}
