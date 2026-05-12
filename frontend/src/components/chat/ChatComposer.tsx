import { useState } from 'react';

interface ChatComposerProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  isSending?: boolean;
}

export const ChatComposer = ({ onSend, disabled, isSending }: ChatComposerProps) => {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed) {
      return;
    }
    onSend(trimmed);
    setMessage('');
  };

  return (
    <div className="rounded-3xl border border-white/60 bg-white/90 p-5 shadow-[0_16px_40px_-30px_rgba(0,0,0,0.35)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
        <div className="flex-1">
          <label className="text-xs uppercase tracking-[0.3em] text-[#a68b5b]">
            Ask Lumiere AI
          </label>
          <textarea
            rows={3}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Share your skin goals, concerns, or product questions..."
            className="mt-2 w-full resize-none rounded-2xl border border-[#e8d5a8] bg-[#faf6f0] px-4 py-3 text-sm text-[#2d2d2d] shadow-inner focus:border-[#c9a96e]"
            disabled={disabled || isSending}
          />
        </div>
        <button
          type="button"
          onClick={handleSend}
          disabled={disabled || isSending}
          className="rounded-full bg-gradient-to-r from-[#c9a96e] to-[#a68b5b] px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-[0_12px_30px_-20px_rgba(201,169,110,0.6)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-20px_rgba(201,169,110,0.75)] disabled:opacity-50"
        >
          {isSending ? 'Sending' : 'Send'}
        </button>
      </div>
    </div>
  );
};
