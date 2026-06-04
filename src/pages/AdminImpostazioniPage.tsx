// ============================================================
// GHIMNA TROTTA 2.0 — pages/AdminImpostazioniPage.tsx
// Impostazioni globali della palestra
// ============================================================
import React, { useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { RouteState } from '../types';
import { ArrowLeft, Save, Clock, AlertCircle } from 'lucide-react';

interface Props { navigate: (r: RouteState) => void; }

interface GymSettings {
  cancellationEnabled: boolean;
  cancellationHoursLimit: number;
}

const DEFAULT_SETTINGS: GymSettings = {
  cancellationEnabled: true,
  cancellationHoursLimit: 2,
};

export default function AdminImpostazioniPage({ navigate }: Props) {
  const [settings, setSettings] = useState<GymSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { loadSettings(); }, []);

  async function loadSettings() {
    setLoading(true);
    try {
      const snap = await getDoc(doc(db, 'gymConfig', 'main'));
      if (snap.exists()) {
        const data = snap.data();
        setSettings({
          cancellationEnabled: data.cancellationEnabled ?? true,
          cancellationHoursLimit: data.cancellationHoursLimit ?? 2,
        });
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    await setDoc(doc(db, 'gymConfig', 'main'), settings, { merge: true });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  if (loading) return (
    <div className="min-h-screen bg-[#2C2C2C] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#C0392B] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#2C2C2C]">
      <div className="bg-[#1a1a1a] px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate({ page: 'ADMIN' })} className="text-white/60 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-white font-bold text-lg">Impostazioni</h1>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="bg-[#C0392B] text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold disabled:opacity-50">
          <Save className="w-4 h-4" />
          {saving ? 'Salvo...' : saved ? '✅ Salvato!' : 'Salva'}
        </button>
      </div>

      <div className="p-4 space-y-4">

        {/* Limite cancellazione */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#C0392B]/20 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-[#C0392B]" />
            </div>
            <div>
              <h2 className="text-white font-bold">Limite cancellazione</h2>
              <p className="text-white/40 text-xs">Blocca le cancellazioni troppo a ridosso del corso</p>
            </div>
          </div>

          {/* Toggle attiva/disattiva */}
          <div className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3">
            <div>
              <p className="text-white text-sm font-medium">Attiva limite cancellazione</p>
              <p className="text-white/40 text-xs mt-0.5">
                {settings.cancellationEnabled
                  ? `I soci non possono cancellare meno di ${settings.cancellationHoursLimit}h prima`
                  : 'I soci possono cancellare in qualsiasi momento'}
              </p>
            </div>
            <button
              onClick={() => setSettings(s => ({ ...s, cancellationEnabled: !s.cancellationEnabled }))}
              className={`w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
                settings.cancellationEnabled ? 'bg-[#C0392B]' : 'bg-white/20'
              }`}>
              <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${
                settings.cancellationEnabled ? 'translate-x-6' : 'translate-x-0'
              }`} />
            </button>
          </div>

          {/* Ore limite */}
          {settings.cancellationEnabled && (
            <div className="space-y-3">
              <p className="text-white/50 text-xs uppercase tracking-widest">
                Ore minime prima del corso
              </p>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 6, 12, 24].map(h => (
                  <button key={h}
                    onClick={() => setSettings(s => ({ ...s, cancellationHoursLimit: h }))}
                    className={`py-3 rounded-xl text-sm font-bold border transition-all ${
                      settings.cancellationHoursLimit === h
                        ? 'bg-[#C0392B] border-[#C0392B] text-white'
                        : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
                    }`}>
                    {h}h
                  </button>
                ))}
              </div>

              {/* Avviso */}
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3 flex gap-3">
                <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                <p className="text-yellow-400/80 text-xs">
                  Con questo limite, un socio che ha prenotato un corso alle 19:00 non potrà cancellare 
                  dopo le {settings.cancellationHoursLimit === 1 ? '18:00' :
                            settings.cancellationHoursLimit === 2 ? '17:00' :
                            settings.cancellationHoursLimit === 3 ? '16:00' :
                            settings.cancellationHoursLimit === 6 ? '13:00' :
                            settings.cancellationHoursLimit === 12 ? '07:00' : 'giorno prima'}.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Prossimamente */}
        <div className="bg-white/3 border border-white/5 rounded-2xl p-4">
          <p className="text-white/30 text-xs uppercase tracking-widest mb-3">Prossimamente</p>
          <div className="space-y-2">
            {['Orari di apertura personalizzati', 'Numero massimo prenotazioni per socio', 'Giorni di chiusura automatica'].map(item => (
              <div key={item} className="flex items-center gap-2 text-white/20">
                <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                <p className="text-xs">{item}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}