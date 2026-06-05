// ============================================================
// GHIMNA TROTTA 2.0 — pages/AdminStatistichePage.tsx
// ============================================================
import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { RouteState } from '../types';
import { ArrowLeft, Users, Calendar, TrendingUp, Star } from 'lucide-react';
import { COURSES_INFO, DAYS_IT } from '../constants';

interface Props { navigate: (r: RouteState) => void; }

interface Stats {
  sociTotali: number;
  sociAttivi: number;
  sociScaduti: number;
  sociProva: number;
  prenotazioniOggi: number;
  postiLiberiOggi: number;
  postiTotaliOggi: number;
  corsoTopNome: string;
  corsoTopCount: number;
  prenotazioniSettimana: number;
  nuoviSociMese: number;
}

export default function AdminStatistichePage({ navigate }: Props) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadStats(); }, []);

  async function loadStats() {
    setLoading(true);
    try {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const dow = today.getDay();

      // Inizio settimana (lunedì)
      const monday = new Date(today);
      monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));
      const mondayStr = monday.toISOString().split('T')[0];

      // Inizio mese
      const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      // Soci
      const usersSnap = await getDocs(collection(db, 'users'));
      const users = usersSnap.docs.map(d => d.data());
      const sociTotali = users.length;
      const sociAttivi = users.filter(u => u.membershipStatus === 'active').length;
      const sociScaduti = users.filter(u => u.membershipStatus === 'expired').length;
      const sociProva = users.filter(u => u.membershipStatus === 'trial').length;
      const nuoviSociMese = users.filter(u => {
        const created = u.createdAt?.toDate?.();
        return created && created >= firstOfMonth;
      }).length;

      // Slot di oggi
      const slotsSnap = await getDocs(query(
        collection(db, 'slots'),
        where('dayOfWeek', '==', dow),
        where('isActive', '==', true)
      ));
      const slots = slotsSnap.docs.map(d => d.data());
      const postiTotaliOggi = slots.reduce((sum, s) => sum + (s.maxCapacity ?? 0), 0);
      const postiOccupatiOggi = slots.reduce((sum, s) => sum + (s.currentBookings ?? 0), 0);
      const postiLiberiOggi = postiTotaliOggi - postiOccupatiOggi;

      // Prenotazioni oggi
      const bookTodaySnap = await getDocs(query(
        collection(db, 'bookings'),
        where('date', '==', todayStr),
        where('status', '==', 'confirmed')
      ));
      const prenotazioniOggi = bookTodaySnap.size;

      // Prenotazioni settimana + corso top
      const bookWeekSnap = await getDocs(query(
        collection(db, 'bookings'),
        where('date', '>=', mondayStr),
        where('date', '<=', todayStr),
        where('status', '==', 'confirmed')
      ));
      const prenotazioniSettimana = bookWeekSnap.size;

      // Corso più prenotato della settimana
      const courseCount: Record<string, { name: string; count: number }> = {};
      bookWeekSnap.docs.forEach(d => {
        const data = d.data();
        const key = data.courseKey ?? 'unknown';
        if (!courseCount[key]) courseCount[key] = { name: data.courseName ?? key, count: 0 };
        courseCount[key].count++;
      });
      const topCourse = Object.values(courseCount).sort((a, b) => b.count - a.count)[0];

      setStats({
        sociTotali,
        sociAttivi,
        sociScaduti,
        sociProva,
        prenotazioniOggi,
        postiLiberiOggi,
        postiTotaliOggi,
        corsoTopNome: topCourse?.name ?? '—',
        corsoTopCount: topCourse?.count ?? 0,
        prenotazioniSettimana,
        nuoviSociMese,
      });
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  const today = new Date();
  const todayLabel = `${DAYS_IT[today.getDay()]} ${today.getDate()}/${today.getMonth() + 1}`;

  return (
    <div className="min-h-screen bg-[#2C2C2C]">
      <div className="bg-[#1a1a1a] px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate({ page: 'ADMIN' })} className="text-white/60 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-white font-bold text-lg">Statistiche</h1>
        </div>
        <button onClick={loadStats} className="text-white/40 hover:text-white text-xs">
          🔄 Aggiorna
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center mt-16">
          <div className="w-8 h-8 border-2 border-[#C0392B] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : stats && (
        <div className="p-4 space-y-4">

          {/* Oggi */}
          <div>
            <p className="text-white/40 text-xs uppercase tracking-widest mb-3">📅 Oggi — {todayLabel}</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#C0392B]/10 border border-[#C0392B]/30 rounded-2xl p-4 text-center">
                <p className="text-[#C0392B] font-black text-3xl">{stats.prenotazioniOggi}</p>
                <p className="text-white/50 text-xs mt-1">Prenotazioni</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                <p className="text-white font-black text-3xl">{stats.postiLiberiOggi}</p>
                <p className="text-white/50 text-xs mt-1">Posti liberi</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                <p className="text-white font-black text-3xl">{stats.postiTotaliOggi}</p>
                <p className="text-white/50 text-xs mt-1">Posti totali</p>
              </div>
            </div>
          </div>

          {/* Questa settimana */}
          <div>
            <p className="text-white/40 text-xs uppercase tracking-widest mb-3">📊 Questa settimana</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                <p className="text-white font-black text-3xl">{stats.prenotazioniSettimana}</p>
                <p className="text-white/50 text-xs mt-1">Prenotazioni</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <p className="text-white/50 text-xs">Corso top</p>
                </div>
                <p className="text-white font-bold text-sm">{stats.corsoTopNome}</p>
                <p className="text-white/40 text-xs">{stats.corsoTopCount} prenotazioni</p>
              </div>
            </div>
          </div>

          {/* Soci */}
          <div>
            <p className="text-white/40 text-xs uppercase tracking-widest mb-3">👥 Soci</p>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white/60 text-sm">Totale iscritti</span>
                <span className="text-white font-black text-xl">{stats.sociTotali}</span>
              </div>
              <div className="h-px bg-white/5" />
              <div className="flex items-center justify-between">
                <span className="text-green-400 text-sm">✅ Abbonamento attivo</span>
                <span className="text-green-400 font-bold">{stats.sociAttivi}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-blue-400 text-sm">🆕 In prova</span>
                <span className="text-blue-400 font-bold">{stats.sociProva}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-red-400 text-sm">❌ Abbonamento scaduto</span>
                <span className="text-red-400 font-bold">{stats.sociScaduti}</span>
              </div>
              <div className="h-px bg-white/5" />
              <div className="flex items-center justify-between">
                <span className="text-white/40 text-sm">🆕 Nuovi questo mese</span>
                <span className="text-white font-bold">{stats.nuoviSociMese}</span>
              </div>
            </div>
          </div>

          {/* Barra occupazione oggi */}
          {stats.postiTotaliOggi > 0 && (
            <div>
              <p className="text-white/40 text-xs uppercase tracking-widest mb-3">📈 Occupazione oggi</p>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="flex justify-between mb-2">
                  <span className="text-white/50 text-xs">
                    {stats.prenotazioniOggi} / {stats.postiTotaliOggi} posti occupati
                  </span>
                  <span className="text-white font-bold text-xs">
                    {Math.round((stats.prenotazioniOggi / stats.postiTotaliOggi) * 100)}%
                  </span>
                </div>
                <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#C0392B] rounded-full transition-all"
                    style={{ width: `${Math.min((stats.prenotazioniOggi / stats.postiTotaliOggi) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
