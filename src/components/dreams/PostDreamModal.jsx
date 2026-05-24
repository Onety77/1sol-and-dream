import { useState } from 'react';
import Modal from '../ui/Modal';
import { dreams as dreamsApi } from '../../services/api';

const MOODS = ['Serious', 'Funny', 'Delusional', 'Beautiful', 'Degenerate', 'Impossible', 'Unfinished'];
const MOOD_EMOJI = { Serious:'🎯', Funny:'😂', Delusional:'🌀', Beautiful:'✨', Degenerate:'🔥', Impossible:'🚀', Unfinished:'⏳' };
const MOOD_ACCENT = {
  Serious:'rgba(0,255,209,0.15)',    Funny:'rgba(255,215,0,0.15)',
  Delusional:'rgba(191,95,255,0.15)', Beautiful:'rgba(0,240,255,0.15)',
  Degenerate:'rgba(255,31,90,0.15)', Impossible:'rgba(255,110,0,0.15)',
  Unfinished:'rgba(120,120,160,0.15)',
};
const MOOD_BORDER = {
  Serious:'rgba(0,255,209,0.35)',    Funny:'rgba(255,215,0,0.35)',
  Delusional:'rgba(191,95,255,0.35)', Beautiful:'rgba(0,240,255,0.35)',
  Degenerate:'rgba(255,31,90,0.35)', Impossible:'rgba(255,110,0,0.35)',
  Unfinished:'rgba(120,120,160,0.35)',
};

export default function PostDreamModal({ open, onClose, onPosted }) {
  const [form, setForm] = useState({ title: '', story: '', mood: '', proofImageUrl: '', proofLink: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const wordCount = form.title.trim() ? form.title.trim().split(/\s+/).length : 0;
  const charCount = form.story.length;

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.mood) { setError('Pick a mood for your dream'); return; }
    setLoading(true); setError('');
    try {
      const result = await dreamsApi.post(form);
      onPosted?.(result.dream);
      onClose();
      setForm({ title: '', story: '', mood: '', proofImageUrl: '', proofLink: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to post dream');
    } finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Post Your Dream" maxWidth={580}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        <div>
          <label className="input-label">
            Dream Title
            <span style={{
              marginLeft: 8, fontFamily: 'var(--font-mono)',
              color: wordCount > 18 ? 'var(--fading)' : 'var(--text-3)',
            }}>{wordCount}/20 words</span>
          </label>
          <input
            className="input" autoFocus required maxLength={200}
            placeholder="What exactly is your dream? Be specific."
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          />
          <p className="input-hint">Your title locks after 30 minutes. Choose it carefully.</p>
        </div>

        <div>
          <label className="input-label">
            Your Story
            <span style={{
              marginLeft: 8, fontFamily: 'var(--font-mono)',
              color: charCount > 260 ? 'var(--fading)' : 'var(--text-3)',
            }}>{charCount}/280</span>
          </label>
          <textarea
            className="input" required maxLength={280} rows={4}
            placeholder="Why this dream. Why you. Why now. Make people believe."
            value={form.story}
            onChange={e => setForm(f => ({ ...f, story: e.target.value }))}
            style={{ resize: 'vertical', minHeight: 96 }}
          />
        </div>

        <div>
          <label className="input-label">Mood</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {MOODS.map(m => (
              <button key={m} type="button" onClick={() => setForm(f => ({ ...f, mood: m }))} style={{
                padding: '7px 14px', borderRadius: 'var(--r-full)', cursor: 'pointer',
                background: form.mood === m ? MOOD_ACCENT[m] : 'rgba(255,255,255,0.03)',
                border: `1px solid ${form.mood === m ? MOOD_BORDER[m] : 'rgba(255,255,255,0.08)'}`,
                color: form.mood === m ? 'var(--text)' : 'var(--text-2)',
                fontSize: '0.8rem', fontWeight: 500, transition: 'all 0.15s',
                transform: form.mood === m ? 'scale(1.06)' : 'scale(1)',
              }}>{MOOD_EMOJI[m]} {m}</button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label className="input-label">Proof Image URL</label>
            <input className="input" placeholder="https://..." value={form.proofImageUrl}
              onChange={e => setForm(f => ({ ...f, proofImageUrl: e.target.value }))} />
          </div>
          <div>
            <label className="input-label">Proof Link</label>
            <input className="input" placeholder="https://..." value={form.proofLink}
              onChange={e => setForm(f => ({ ...f, proofLink: e.target.value }))} />
          </div>
        </div>

        {error && (
          <div style={{
            background: 'rgba(255,31,90,0.08)', border: '1px solid rgba(255,31,90,0.25)',
            borderRadius: 'var(--r-md)', padding: '10px 14px',
            fontSize: '0.82rem', color: 'var(--fading)',
          }}>{error}</div>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={loading || !form.mood}>
            {loading ? 'Posting...' : 'Post My Dream'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
