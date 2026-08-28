import styles from './MessageInput.module.css';

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  /** 入力欄が複数ある画面で、どちらに何を書くかを示す。1つだけの画面では省く。 */
  label?: string;
};

export function MessageInput({ value, onChange, placeholder, label }: Props) {
  const textarea = (
    <textarea
      className={styles.messageInput}
      value={value}
      onChange={(e) => onChange(e.currentTarget.value)}
      placeholder={placeholder}
      rows={5}
    />
  );
  if (!label) {
    return textarea;
  }
  return (
    <label className={styles.messageInputField}>
      <span className={styles.messageInputLabel}>{label}</span>
      {textarea}
    </label>
  );
}
