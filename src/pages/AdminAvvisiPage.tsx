// ============================================================
// GHIMNA TROTTA 2.0 — pages/AdminAvvisiPage.tsx
// ============================================================
import React, { useEffect, useState } from 'react';
import {
  collection, getDocs, addDoc, deleteDoc,
  doc, serverTimestamp, query, orderBy
} from 'firebase/firestore';
import { db } from '../firebase';
import { RouteState } from '../types';
import { ArrowLeft, Plus, Trash2, X, Megaphone } from 'lucide-react';

interface Props { navigate: (r: RouteState) => void; }

interface Avviso {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success';
  createdAt: Date;
  pinned: boolean;
}

const TYPE_CONFIG = {
  info:    { label: 'Info',     color: 'bg-blue-500/20 border-blue-500/30 text-blue-300',    emoji: 'ℹ️' },
  warning: { label: 'Avviso',  color: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300', emoji: '⚠️' },
  success: { label: 'Novità',  color: 'bg-green-500/20 border-green-500/30 text-green-300',  emoji: '🎉' },
};

export default function AdminAvvisiPage({ navigate }: Props) {
  const [avvisi, setAvvisi] = useState<Avviso[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', message: '', type: 'info' as 'info' | 'warning' | 'success', pinned: false });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadAvvisi(); }, []);

  async function loadAvvisi() {
    setLoading(true);
    const snap = await getDocs(query(collection(db, 'avvisi'), orderBy('createdAt', 'desc')));
    setAvvisi(snap.docs.map(d => ({
      id: d.id,
      ...d.data(),
      createdAt: d.data().createdAt?.toDate?.() ?? new Date(),
    } as Avviso)));
    setLoading(false);
  }

  async function handleSave() {
    if (!form.title.trim() || !form.message.trim()) return;
    setSaving(true);
    await addDoc(collection(db, 'avvisi'), {
      ...form,
      createdAt: serverTimestamp(),
    });
    setForm({ title: '', message: '', type: 'info', pinned: false });
    setShowForm(false);
    await loadAvvisi();
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Eliminare questo avviso?')) return;
    await deleteDoc(doc(db, 'avvisi', id));
    setAvvisi(prev => prev.filter(a => a.id !== id));
  }

  return (
    <div className="min-h-screen bg-[#2C2C2C]">
      <div className="bg-[#1a1a1a] px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate({ page: 'ADMIN' })} className="text-white/60 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-white font-bold text-lg">Bacheca Avvisi</h1>
        </div>
        <button onClick={() => setShowForm(true)}
          className="bg-[#C0392B] text-white px-3 py-2 rounded-xl flex items-center gap-1 text-sm font-bold">
          <Plus className="w-4 h-4" /> Nuovo
        </button>
      </div>

      <div className="p-4 space-y-3">
        {loading ? (
          <div className="flex justify-center mt-12">
            <div className="w-8 h-8 border-2 border-[#C0392B] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : avvisi.length === 0 ? (
          <div className="text-center mt-12 text-white/30">
            <Megaphone className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Nessun avviso. Creane uno!</p>
          </div>
        ) : (
          avvisi.map(avviso => {
            const cfg = TYPE_CONFIG[avviso.type];
            return (
              <div key={avviso.id} className={`border rounded-2xl p-4 ${cfg.color}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span>{cfg.emoji}</span>
                      <p className="font-bold text-white">{avviso.title}</p>
                      {avviso.pinned && <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">📌 In evidenza</span>}
                    </div>
                    <p className="text-sm opacity-80">{avviso.message}</p>
                    <p className="text-xs opacity-50 mt-2">
                      {avviso.createdAt.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <button onClick={() => handleDelete(avviso.id)}
                    className="flex-shrink-0 w-8 h-8 bg-white/10 hover:bg-red-500/20 rounded-lg flex items-center justify-center text-white/40 hover:text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Form modale */}
      {showForm && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end">
          <div className="bg-[#1e1e1e] w-full rounded-t-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-bold text-lg">Nuovo avviso</h2>
              <button onClick={() => setShowForm(false)} className="text-white/40 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tipo */}
            <div className="grid grid-cols-3 gap-2">
              {(['info', 'warning', 'success'] as const).map(t => (
                <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))}
                  className={`py-2 rounded-xl text-sm font-bold border transition-all ${
                    form.type === t ? TYPE_CONFIG[t].color : 'bg-white/5 border-white/10 text-white/40'
                  }`}>
                  {TYPE_CONFIG[t].emoji} {TYPE_CONFIG[t].label}
                </button>
              ))}
            </div>

            {/* Titolo */}
            <input
              type="text"
              placeholder="Titolo avviso"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="w-full bg-white/10 text-white placeholder-white/30 border border-white/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#C0392B]"
            />

            {/* Messaggio */}
            <textarea
              placeholder="Scrivi il messaggio per i soci..."
              value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              rows={3}
              className="w-full bg-white/10 text-white placeholder-white/30 border border-white/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#C0392B] resize-none"
            />

            {/* Pinned */}
            <div className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3">
              <div>
                <p className="text-white text-sm">📌 Metti in evidenza</p>
                <p className="text-white/40 text-xs">Appare sempre in cima</p>
              </div>
              <button onClick={() => setForm(f => ({ ...f, pinned: !f.pinned }))}
                className={`w-12 h-6 rounded-full transition-colors ${form.pinned ? 'bg-[#C0392B]' : 'bg-white/20'}`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${form.pinned ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>

            <button onClick={handleSave} disabled={saving || !form.title.trim() || !form.message.trim()}
              className="w-full bg-[#C0392B] hover:bg-[#96281B] text-white font-bold py-3 rounded-xl disabled:opacity-50 transition-colors">
              {saving ? 'Pubblicazione...' : 'Pubblica avviso'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
