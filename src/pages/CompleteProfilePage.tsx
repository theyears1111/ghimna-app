// ============================================================
// GHIMNA TROTTA 2.0 — pages/CompleteProfilePage.tsx
// ============================================================
import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { Phone } from 'lucide-react';

export default function CompleteProfilePage() {
  const { updateProfile, logout } = useAuth();
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
    setPhone(val);
    setError('');
  }

  async function handleSave() {
    if (phone.length < 9) {
      setError('Il numero deve avere almeno 9 cifre');
      return;
    }
    setSaving(true);
    await updateProfile({ phone });
    setSaving(false);
  }

  return (
    <div className="min-h-screen bg-[#2C2C2C] flex flex-col items-center justify-center px-4">
      <div className="mb-8 text-center">
        <div className="text-4xl font-black text-white">G<span className="text-[#C0392B]">T</span></div>
        <p className="text-white/50 text-xs tracking-widest uppercase mt-1">Ghimna Trotta</p>
      </div>
      <div className="w-full max-w-sm bg-white/5 border border-white/10 rounded-2xl p-6 space-y-5">
        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-16 h-16 bg-[#C0392B]/20 rounded-full flex items-center justify-center">
            <Phone className="w-8 h-8 text-[#C0392B]" />
          </div>
          <div>
            <h1 className="text-white font-bold text-xl">Un ultimo passo!</h1>
            <p className="text-white/50 text-sm mt-1">
              Inserisci il tuo numero di telefono per completare la registrazione.
              Serve alla palestra per contattarti se necessario.
            </p>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-white/50 text-xs uppercase tracking-widest">Numero di telefono</label>
          <input
            type="tel"
            inputMode="numeric"
            placeholder="Es. 3331234567"
            value={phone}
            onChange={handleChange}
            maxLength={10}
            className="w-full bg-white/10 text-white placeholder-white/30 border border-white/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#C0392B] tracking-widest"
            autoFocus
          />
          <div className="flex items-center justify-between">
            {error
              ? <p className="text-red-400 text-xs">{error}</p>
              : <p className="text-white/20 text-xs">Solo numeri, 9-10 cifre</p>
            }
            <p className="text-white/30 text-xs">{phone.length}/10</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || phone.length < 9}
          className="w-full bg-[#C0392B] hover:bg-[#96281B] text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50">
          {saving ? 'Salvataggio...' : 'Continua →'}
        </button>
        <button onClick={logout} className="w-full text-white/30 hover:text-white/50 text-xs text-center transition-colors">
          Esci dall'account
        </button>
      </div>
    </div>
  );
}