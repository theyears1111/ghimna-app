// ============================================================
// GHIMNA TROTTA 2.0 — pages/LoginPage.tsx
// ============================================================

import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { RouteState } from '../types';
import { BRAND, COLORS } from '../constants';

interface Props {
  navigate: (route: RouteState) => void;
}

export default function LoginPage({ navigate }: Props) {
  const { loginEmail, loginGoogle } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await loginEmail(email, password);
      // AuthContext gestisce il redirect automaticamente
    } catch (err: any) {
      setError(getErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError('');
    try {
      await loginGoogle();
    } catch (err: any) {
      setError('Accesso con Google fallito. Riprova.');
    }
  }

  return (
    <div className="min-h-screen bg-[#2C2C2C] flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="text-4xl font-black tracking-tight text-white">
          G<span className="text-[#C0392B]">T</span>
        </div>
        <p className="text-white/50 text-xs tracking-widest uppercase mt-1">
          {BRAND.shortName}
        </p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
        <h1 className="text-white text-xl font-bold">Accedi</h1>

        {error && (
          <div className="bg-red-500/20 border border-red-500/40 text-red-300 text-sm px-4 py-2 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailLogin} className="space-y-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-white/10 text-white placeholder-white/40 border border-white/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#C0392B]"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full bg-white/10 text-white placeholder-white/40 border border-white/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#C0392B]"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#C0392B] hover:bg-[#96281B] text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? 'Accesso...' : 'Accedi'}
          </button>
        </form>

        <div className="relative flex items-center gap-3">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-white/30 text-xs">oppure</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        <button
          onClick={handleGoogle}
          className="w-full bg-white hover:bg-gray-100 text-gray-800 font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continua con Google
        </button>

        <p className="text-center text-white/40 text-sm">
          Non hai un account?{' '}
          <button
            onClick={() => navigate({ page: 'REGISTER' })}
            className="text-[#C0392B] hover:underline font-semibold"
          >
            Registrati
          </button>
        </p>
      </div>
    </div>
  );
}

function getErrorMessage(code: string): string {
  switch (code) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Email o password non corretti.';
    case 'auth/too-many-requests':
      return 'Troppi tentativi. Riprova tra qualche minuto.';
    case 'auth/invalid-email':
      return 'Email non valida.';
    default:
      return 'Errore di accesso. Riprova.';
  }
}
