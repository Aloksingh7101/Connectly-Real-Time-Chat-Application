import { useRef, useState } from 'react';
import { Send, Paperclip, X, FileText } from 'lucide-react';
import { uploadService } from '../../services/uploadService';
import Spinner from '../ui/Spinner';

export default function MessageInput({ onSend, onTyping, disabled }) {
  const [text, setText] = useState('');
  const [pendingAttachment, setPendingAttachment] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed && !pendingAttachment) return;
    onSend(trimmed, pendingAttachment ? [pendingAttachment] : []);
    setText('');
    setPendingAttachment(null);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const uploaded = await uploadService.uploadFile(file);
      setPendingAttachment(uploaded);
    } catch (err) {
      console.error('Upload failed:', err.message);
    } finally {
      setUploading(false);
      e.target.value = ''; // allow re-selecting the same file
    }
  };

  return (
    <div className="border-t border-black/5 bg-white">
      {pendingAttachment && (
        <div className="flex items-center gap-2 border-b border-black/5 px-3 py-2">
          {pendingAttachment.type === 'image' ? (
            <img src={pendingAttachment.url} alt="" className="h-12 w-12 rounded-lg object-cover" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-graphite-800">
              <FileText className="h-5 w-5 text-white/70" />
            </div>
          )}
          <span className="flex-1 truncate text-xs text-ink/60">{pendingAttachment.name}</span>
          <button
            onClick={() => setPendingAttachment(null)}
            className="rounded-full p-1 hover:bg-black/5"
            aria-label="Remove attachment"
          >
            <X className="h-4 w-4 text-ink/50" />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-end gap-2 p-3">
        <input ref={fileInputRef} type="file" hidden onChange={handleFileChange} />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink/50 hover:bg-black/5"
          aria-label="Attach file"
        >
          {uploading ? <Spinner className="h-4 w-4" /> : <Paperclip className="h-4 w-4" />}
        </button>

        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            onTyping?.();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          placeholder="Message"
          rows={1}
          className="max-h-32 flex-1 resize-none rounded-xl border border-black/10 px-3.5 py-2.5 text-sm outline-none focus:border-coral"
        />
        <button
          type="submit"
          disabled={disabled || (!text.trim() && !pendingAttachment)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-coral text-white transition-colors hover:bg-coral-dark disabled:opacity-40"
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
