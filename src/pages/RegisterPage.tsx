// ============================================================
// GHIMNA TROTTA 2.0 — pages/RegisterPage.tsx
// ============================================================
import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { RouteState } from '../types';

interface Props { navigate: (r: RouteState) => void; }

export default function RegisterPage({ navigate }: Props) {
  const { register } = useAuth();
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) { setError('Password minimo 6 caratteri.'); return; }
    setError(''); setLoading(true);
    try {
      await register(email, password, name);
    } catch (err: any) {
      setError(err.code === 'auth/email-already-in-use'
        ? 'Email già registrata.' : 'Errore di registrazione. Riprova.');
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-[#2C2C2C] flex flex-col items-center justify-center px-4">
      <div className="mb-8 text-center">
        <div className="text-4xl font-black text-white">G<span className="text-[#C0392B]">T</span></div>
        <p className="text-white/50 text-xs tracking-widest uppercase mt-1">Ghimna Trotta</p>
      </div>
      <div className="w-full max-w-sm bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
        <h1 className="text-white text-xl font-bold">Crea account</h1>
        {error && <div className="bg-red-500/20 border border-red-500/40 text-red-300 text-sm px-4 py-2 rounded-lg">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <input type="text" placeholder="Nome completo" value={name} onChange={e => setName(e.target.value)} required
            className="w-full bg-white/10 text-white placeholder-white/40 border border-white/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#C0392B]" />
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required
            className="w-full bg-white/10 text-white placeholder-white/40 border border-white/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#C0392B]" />
          <input type="password" placeholder="Password (min. 6 caratteri)" value={password} onChange={e => setPassword(e.target.value)} required
            className="w-full bg-white/10 text-white placeholder-white/40 border border-white/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#C0392B]" />
          <button type="submit" disabled={loading}
            className="w-full bg-[#C0392B] hover:bg-[#96281B] text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50">
            {loading ? 'Registrazione...' : 'Registrati'}
          </button>
        </form>
        <p className="text-center text-white/40 text-sm">
          Hai già un account?{' '}
          <button onClick={() => navigate({ page: 'LOGIN' })} className="text-[#C0392B] hover:underline font-semibold">Accedi</button>
        </p>
      </div>
    </div>
  );
}
