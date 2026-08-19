import { useEffect, useState } from 'react';
import './ConnectionStatus.css';

/** check は useEffect の依存になるため、呼び出し側で参照を安定させること。 */
type Props = { check: () => Promise<boolean> };

export function ConnectionStatus({ check }: Props) {
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    const run = async () => setOk(await check());
    run();
    const timer = setInterval(run, 15_000);
    return () => clearInterval(timer);
  }, [check]);

  if (ok === null) return null;
  return (
    <span className="connection-status" data-ok={ok}>
      {ok ? '接続中' : '未接続'}
    </span>
  );
}
