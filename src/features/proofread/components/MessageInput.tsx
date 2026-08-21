import './MessageInput.css';

type Props = { value: string; onChange: (value: string) => void };

export function MessageInput({ value, onChange }: Props) {
  return (
    <textarea
      className="message-input"
      value={value}
      onChange={(e) => onChange(e.currentTarget.value)}
      placeholder="校正したいメッセージを貼り付け"
      rows={5}
    />
  );
}
