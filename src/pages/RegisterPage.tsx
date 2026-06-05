// ============================================================
// GHIMNA TROTTA 2.0 — pages/RegisterPage.tsx — REDESIGN
// ============================================================
import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { RouteState } from '../types';

interface Props { navigate: (r: RouteState) => void; }

export default function RegisterPage({ navigate }: Props) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) { setError('Password minimo 6 caratteri.'); return; }
    setError(''); setLoading(true);
    try { await register(email, password, name); }
    catch (err: any) {
      setError(err.code === 'auth/email-already-in-use' ? 'Email già registrata.' : 'Errore. Riprova.');
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex flex-col">
      {/* Hero compatto */}
      <div className="relative h-48 flex-shrink-0 overflow-hidden">
        <img src="/gym-corsi.jpg" alt="Ghimna Trotta" className="w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-[#1a1a1a]" />
        <div className="absolute bottom-4 left-5 flex items-center gap-3">
          <img src="/logo-gt.jpg" alt="GT" className="w-12 h-12 rounded-full border border-white/20" />
          <div>
            <p className="text-white font-black text-base tracking-widest">GHIMNA TROTTA</p>
            <p className="text-[#C0392B] font-black text-xs tracking-widest">2.0 — EBOLI (SA)</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 px-5 pt-4 pb-8">
        <h2 className="text-white font-black text-xl tracking-tight mb-1">CREA ACCOUNT</h2>
        <p className="text-white/40 text-sm mb-6">Unisciti alla famiglia Ghimna Trotta</p>

        {error && (
          <div className="bg-red-500/15 border border-red-500/30 text-red-300 text-sm px-4 py-3 rounded-xl mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <input type="text" placeholder="Nome e cognome" value={name}
            onChange={e => setName(e.target.value)} required
            className="w-full bg-white/15 text-white placeholder-white/60 border border-white/25 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-[#C0392B] transition-colors" />
          <input type="email" placeholder="Email" value={email}
            onChange={e => setEmail(e.target.value)} required
            className="w-full bg-white/15 text-white placeholder-white/60 border border-white/25 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-[#C0392B] transition-colors" />
          <input type="password" placeholder="Password (min. 6 caratteri)" value={password}
            onChange={e => setPassword(e.target.value)} required
            className="w-full bg-white/15 text-white placeholder-white/60 border border-white/25 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-[#C0392B] transition-colors" />
          <button type="submit" disabled={loading}
            className="w-full bg-[#C0392B] hover:bg-[#96281B] text-white font-black py-4 rounded-xl transition-colors disabled:opacity-50 tracking-widest text-sm">
            {loading ? 'REGISTRAZIONE...' : 'REGISTRATI'}
          </button>
        </form>

        <p className="text-center text-white/30 text-sm mt-6">
          Hai già un account?{' '}
          <button onClick={() => navigate({ page: 'LOGIN' })}
            className="text-[#C0392B] font-bold hover:underline">
            Accedi
          </button>
        </p>
      </div>
    </div>
  );
}