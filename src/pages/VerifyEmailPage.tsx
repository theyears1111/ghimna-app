// ============================================================
// GHIMNA TROTTA 2.0 — pages/VerifyEmailPage.tsx
// ============================================================
import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { RouteState } from '../types';
import { Mail } from 'lucide-react';

interface Props { navigate: (r: RouteState) => void; }

export default function VerifyEmailPage({ navigate }: Props) {
  const { sendVerificationEmail, logout, firebaseUser } = useAuth();
  const [sent, setSent] = useState(false);

  async function handleResend() {
    await sendVerificationEmail();
    setSent(true);
    setTimeout(() => setSent(false), 5000);
  }

  return (
    <div className="min-h-screen bg-[#2C2C2C] flex flex-col items-center justify-center px-4 text-center">
      <div className="w-20 h-20 bg-[#C0392B]/20 rounded-full flex items-center justify-center mb-6">
        <Mail className="w-10 h-10 text-[#C0392B]" />
      </div>
      <h1 className="text-white text-2xl font-bold mb-2">Verifica la tua email</h1>
      <p className="text-white/50 text-sm mb-1">Abbiamo inviato un link a</p>
      <p className="text-white font-semibold mb-6">{firebaseUser?.email}</p>
<p className="text-white/40 text-xs mb-8 max-w-xs">
  Clicca il link nell'email per attivare il tuo account. La pagina si aggiornerà automaticamente.
</p>
<p className="text-yellow-400/70 text-xs mb-8 max-w-xs -mt-4">
  ⚠️ Se non la trovi, controlla la cartella <strong>Spam</strong> o <strong>Posta indesiderata</strong>.
</p>
      <button onClick={handleResend}
        className="bg-[#C0392B] hover:bg-[#96281B] text-white font-bold px-6 py-3 rounded-xl transition-colors mb-4">
        {sent ? '✅ Email inviata!' : 'Invia di nuovo'}
      </button>
      <button onClick={logout} className="text-white/30 hover:text-white/60 text-sm transition-colors">
        Esci
      </button>
    </div>
  );
}
