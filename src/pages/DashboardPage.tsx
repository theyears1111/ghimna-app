// ============================================================
// GHIMNA TROTTA 2.0 — pages/DashboardPage.tsx
// ============================================================

import React, { useEffect, useState } from 'react';
import {
  collection, query, where, getDocs, deleteDoc,
  doc, updateDoc, increment, orderBy
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { RouteState } from '../types';
import { BRAND, COURSES_INFO } from '../constants';
import { Dumbbell, Bell, User, LogOut, Shield, Calendar, ChevronRight, X } from 'lucide-react';

interface Props { navigate: (r: RouteState) => void; }

interface Booking {
  id: string;
  slotId: string;
  courseName: string;
  courseKey: string;
  date: string;
  startTime: string;
  status: string;
}

interface Avviso {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success';
  pinned: boolean;
  createdAt: Date;
}

const DAY_FULL = ['Domenica','Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato'];
const MONTHS = ['gen','feb','mar','apr','mag','giu','lug','ago','set','ott','nov','dic'];

const AVVISO_COLORS = {
  info:    'bg-blue-500/10 border-blue-500/20 text-blue-300',
  warning: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-300',
  success: 'bg-green-500/10 border-green-500/20 text-green-300',
};
const AVVISO_EMOJI = { info: 'ℹ️', warning: '⚠️', success: '🎉' };

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date(); today.setHours(0,0,0,0);
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  if (d.getTime() === today.getTime()) return 'Oggi';
  if (d.getTime() === tomorrow.getTime()) return 'Domani';
  return `${DAY_FULL[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export default function DashboardPage({ navigate }: Props) {
  const { user, logout } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [avvisi, setAvvisi] = useState<Avviso[]>([]);

  useEffect(() => { if (user) loadUpcomingBookings(); }, [user]);

  useEffect(() => {
    async function loadAvvisi() {
      try {
        const snap = await getDocs(query(collection(db, 'avvisi'), orderBy('createdAt', 'desc')));
        setAvvisi(snap.docs.map(d => ({
          id: d.id, ...d.data(),
          createdAt: d.data().createdAt?.toDate?.() ?? new Date(),
        } as Avviso)));
      } catch (e) { console.error(e); }
    }
    loadAvvisi();
  }, []);

  async function loadUpcomingBookings() {
    if (!user) return;
    setLoadingBookings(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const q = query(
        collection(db, 'bookings'),
        where('userId', '==', user.uid),
        where('status', '==', 'confirmed'),
        where('date', '>=', today),
      );
      const snap = await getDocs(q);
      const data = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as Booking))
        .sort((a, b) => a.date !== b.date ? a.date.localeCompare(b.date) : a.startTime.localeCompare(b.startTime));
      setBookings(data);
    } catch (e) { console.error(e); }
    setLoadingBookings(false);
  }

  async function handleCancel(booking: Booking) {
    if (cancelling) return;
    if (!confirm(`Cancellare la prenotazione per ${booking.courseName}?`)) return;
    setCancelling(booking.id);
    try {
      await deleteDoc(doc(db, 'bookings', booking.id));
      await updateDoc(doc(db, 'slots', booking.slotId), { currentBookings: increment(-1) });
      setBookings(prev => prev.filter(b => b.id !== booking.id));
    } catch (e) { console.error(e); }
    setCancelling(null);
  }

  if (!user) return null;

  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toTimeString().slice(0, 5);
  const nextBooking = bookings.find(b => b.date > today || (b.date === today && b.startTime > now));
  const isActive = user.membershipStatus === 'active' || user.membershipStatus === 'trial';

  // Avvisi: prima i pinned, poi gli altri
  const avvisiSorted = [...avvisi].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  return (
    <div className="min-h-screen bg-[#2C2C2C] flex flex-col">
      {/* Header */}
      <div className="bg-[#1a1a1a] px-4 py-4 flex items-center justify-between">
        <div>
          <div className="text-white font-black text-xl tracking-tight">G<span className="text-[#C0392B]">T</span></div>
          <p className="text-white/40 text-xs">{BRAND.shortName}</p>
        </div>
        <div className="flex items-center gap-3">
          {user.role === 'admin' && (
            <button onClick={() => navigate({ page: 'ADMIN' })} className="bg-[#C0392B]/20 p-2 rounded-lg">
              <Shield className="w-5 h-5 text-[#C0392B]" />
            </button>
          )}
          <button onClick={() => navigate({ page: 'NOTIFICATIONS' })} className="text-white/60 hover:text-white">
            <Bell className="w-5 h-5" />
          </button>
          <button onClick={() => navigate({ page: 'PROFILE' })} className="text-white/60 hover:text-white">
            <User className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5">

        {/* Welcome */}
        <div>
          <h1 className="text-white text-2xl font-bold">Ciao, {user.displayName.split(' ')[0]}! 👋</h1>

          {/* Prossimo corso in evidenza */}
          {nextBooking && (
            <div className="mt-3 bg-[#C0392B] rounded-2xl p-4">
              <p className="text-white/70 text-xs uppercase tracking-widest mb-1">Prossimo corso</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-black text-lg leading-tight">{nextBooking.courseName}</p>
                  <p className="text-white/80 text-sm mt-0.5">{formatDate(nextBooking.date)} · {nextBooking.startTime}</p>
                </div>
                <span className="text-3xl">{COURSES_INFO[nextBooking.courseKey]?.emoji ?? '🏋️'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Avvisi bacheca */}
        {avvisiSorted.length > 0 && (
          <div className="space-y-2">
            {avvisiSorted.slice(0, 3).map(avviso => (
              <div key={avviso.id} className={`border rounded-2xl p-3 ${AVVISO_COLORS[avviso.type]}`}>
                <p className="font-bold text-sm">
                  {avviso.pinned && '📌 '}{AVVISO_EMOJI[avviso.type]} {avviso.title}
                </p>
                <p className="text-xs opacity-70 mt-0.5">{avviso.message}</p>
              </div>
            ))}
          </div>
        )}

        {/* Abbonamento */}
        <div className={`rounded-2xl p-4 border ${isActive ? 'bg-white/5 border-white/10' : 'bg-red-500/10 border-red-500/20'}`}>
          <p className="text-white/50 text-xs uppercase tracking-widest mb-1">Abbonamento</p>
          <p className="text-white font-bold">
            {user.membershipStatus === 'active' ? '✅ Attivo' :
             user.membershipStatus === 'trial' ? '🆕 Prova' :
             user.membershipStatus === 'expired' ? '❌ Scaduto' : '⏸️ Sospeso'}
          </p>
          {user.membershipExpiry && (
            <p className="text-white/40 text-xs mt-0.5">Scade il {user.membershipExpiry.toLocaleDateString('it-IT')}</p>
          )}
        </div>

        {/* Le mie prenotazioni */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white font-bold text-base">Le mie prenotazioni</h2>
            <button onClick={() => navigate({ page: 'COURSES' })}
              className="text-[#C0392B] text-xs font-semibold flex items-center gap-0.5">
              Aggiungi <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {loadingBookings ? (
            <div className="flex justify-center py-6">
              <div className="w-6 h-6 border-2 border-[#C0392B] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : bookings.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
              <p className="text-3xl mb-2">📅</p>
              <p className="text-white/50 text-sm">Nessuna prenotazione</p>
              <button onClick={() => navigate({ page: 'COURSES' })}
                className="mt-3 bg-[#C0392B] text-white text-sm font-bold px-5 py-2 rounded-xl">
                Prenota un corso
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {bookings.map(booking => {
                const info = COURSES_INFO[booking.courseKey] ?? { emoji: '🏋️' };
                const isToday = booking.date === today;
                return (
                  <div key={booking.id} className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-3">
                    <span className="text-2xl">{info.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold text-sm truncate">{booking.courseName}</p>
                      <p className={`text-xs mt-0.5 ${isToday ? 'text-[#C0392B] font-semibold' : 'text-white/40'}`}>
                        {formatDate(booking.date)} · {booking.startTime}
                      </p>
                    </div>
                    <button onClick={() => handleCancel(booking)} disabled={cancelling === booking.id}
                      className="w-7 h-7 bg-white/10 hover:bg-red-500/20 rounded-lg flex items-center justify-center text-white/30 hover:text-red-400 transition-colors flex-shrink-0">
                      {cancelling === booking.id
                        ? <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                        : <X className="w-3 h-3" />}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* CTA Corsi */}
        <button onClick={() => navigate({ page: 'COURSES' })}
          className="w-full bg-[#C0392B] hover:bg-[#96281B] text-white rounded-2xl p-4 flex items-center justify-between transition-colors">
          <div className="flex items-center gap-3">
            <Dumbbell className="w-5 h-5" />
            <span className="font-bold">Vedi tutti i corsi</span>
          </div>
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Info palestra */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <h2 className="text-white font-bold mb-2">📍 Dove siamo</h2>
          <p className="text-white/60 text-sm">{BRAND.address}, {BRAND.city}</p>
          <p className="text-white/60 text-sm">📞 {BRAND.phone1} / {BRAND.phone2}</p>
          <div className="text-white/40 text-xs space-y-0.5 mt-2 border-t border-white/5 pt-2">
            <p>Lun–Ven: 07:00 – 22:15</p>
            <p>Sabato: 07:00 – 19:30</p>
            <p>Domenica: Chiuso</p>
          </div>
        </div>

      </div>

      {/* Bottom nav */}
      <div className="bg-[#1a1a1a] border-t border-white/10 px-4 py-3 flex justify-around">
        <button onClick={() => navigate({ page: 'DASHBOARD' })} className="flex flex-col items-center gap-1 text-[#C0392B]">
          <Dumbbell className="w-5 h-5" /><span className="text-xs">Home</span>
        </button>
        <button onClick={() => navigate({ page: 'COURSES' })} className="flex flex-col items-center gap-1 text-white/40 hover:text-white">
          <Calendar className="w-5 h-5" /><span className="text-xs">Corsi</span>
        </button>
        <button onClick={() => navigate({ page: 'PROFILE' })} className="flex flex-col items-center gap-1 text-white/40 hover:text-white">
          <User className="w-5 h-5" /><span className="text-xs">Profilo</span>
        </button>
        <button onClick={logout} className="flex flex-col items-center gap-1 text-white/40 hover:text-white">
          <LogOut className="w-5 h-5" /><span className="text-xs">Esci</span>
        </button>
      </div>
    </div>
  );
}