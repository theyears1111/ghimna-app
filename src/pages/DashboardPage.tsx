// ============================================================
// GHIMNA TROTTA 2.0 — pages/DashboardPage.tsx — REDESIGN
// ============================================================

import React, { useEffect, useState } from 'react';
import {
  collection, query, where, getDocs, deleteDoc,
  doc, updateDoc, increment, orderBy, getDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { RouteState } from '../types';
import { BRAND, COURSES_INFO } from '../constants';
import { Dumbbell, Bell, User, LogOut, Shield, Calendar, ChevronRight, X, MapPin, Phone, Instagram } from 'lucide-react';

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

interface GymSettings {
  cancellationEnabled: boolean;
  cancellationHoursLimit: number;
}

function canCancel(booking: Booking, settings: GymSettings): boolean {
  if (!settings.cancellationEnabled) return true;
  const [h, m] = booking.startTime.split(':').map(Number);
  const courseDateTime = new Date(booking.date + 'T00:00:00');
  courseDateTime.setHours(h, m, 0, 0);
  const limitMs = settings.cancellationHoursLimit * 60 * 60 * 1000;
  return new Date().getTime() < courseDateTime.getTime() - limitMs;
}

const DAY_FULL = ['Domenica','Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato'];
const MONTHS = ['gen','feb','mar','apr','mag','giu','lug','ago','set','ott','nov','dic'];

const AVVISO_COLORS = {
  info:    'bg-blue-500/10 border-blue-500/30 text-blue-300',
  warning: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300',
  success: 'bg-green-500/10 border-green-500/30 text-green-300',
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

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Buongiorno';
  if (h < 18) return 'Buon pomeriggio';
  return 'Buonasera';
}

export default function DashboardPage({ navigate }: Props) {
  const { user, logout } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [avvisi, setAvvisi] = useState<Avviso[]>([]);
  const [settings, setSettings] = useState<GymSettings>({ cancellationEnabled: true, cancellationHoursLimit: 2 });

  useEffect(() => { if (user) loadUpcomingBookings(); }, [user]);
  useEffect(() => {
    async function loadAvvisi() {
      try {
        const snap = await getDocs(query(collection(db, 'avvisi'), orderBy('createdAt', 'desc')));
        setAvvisi(snap.docs.map(d => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate?.() ?? new Date() } as Avviso)));
      } catch (e) { console.error(e); }
    }
    loadAvvisi();
  }, []);
  useEffect(() => {
    async function loadSettings() {
      try {
        const snap = await getDoc(doc(db, 'gymConfig', 'main'));
        if (snap.exists()) {
          const data = snap.data();
          setSettings({ cancellationEnabled: data.cancellationEnabled ?? true, cancellationHoursLimit: data.cancellationHoursLimit ?? 2 });
        }
      } catch (e) { console.error(e); }
    }
    loadSettings();
  }, []);

  async function loadUpcomingBookings() {
    if (!user) return;
    setLoadingBookings(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const snap = await getDocs(query(
        collection(db, 'bookings'),
        where('userId', '==', user.uid),
        where('status', '==', 'confirmed'),
        where('date', '>=', today),
      ));
      const data = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as Booking))
        .sort((a, b) => a.date !== b.date ? a.date.localeCompare(b.date) : a.startTime.localeCompare(b.startTime));
      setBookings(data);
    } catch (e) { console.error(e); }
    setLoadingBookings(false);
  }

  async function handleCancel(booking: Booking) {
    if (cancelling) return;
    if (!canCancel(booking, settings)) {
      alert(`Non puoi cancellare meno di ${settings.cancellationHoursLimit} ore prima del corso.`);
      return;
    }
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
  const avvisiSorted = [...avvisi].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
  const firstName = user.displayName.split(' ')[0];

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex flex-col">

      {/* HERO HEADER con foto palestra */}
      <div className="relative h-56 overflow-hidden flex-shrink-0">
        <img
          src="/gym-corsi.jpg"
          alt="Ghimna Trotta"
          className="w-full h-full object-cover object-center"
        />
        {/* Overlay gradiente */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-[#1a1a1a]" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 px-4 pt-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <img src="/logo-gt.jpg" alt="GT" className="w-8 h-8 rounded-full" />
            <div>
              <p className="text-white font-black text-sm tracking-tight leading-none">GHIMNA TROTTA</p>
              <p className="text-[#C0392B] text-xs font-bold tracking-widest">2.0</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {user.role === 'admin' && (
              <button onClick={() => navigate({ page: 'ADMIN' })}
                className="bg-[#C0392B] p-2 rounded-xl">
                <Shield className="w-4 h-4 text-white" />
              </button>
            )}
            <button onClick={() => navigate({ page: 'NOTIFICATIONS' })}
              className="bg-black/40 backdrop-blur p-2 rounded-xl text-white/80">
              <Bell className="w-4 h-4" />
            </button>
            <button onClick={() => navigate({ page: 'PROFILE' })}
              className="bg-black/40 backdrop-blur p-2 rounded-xl text-white/80">
              <User className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Benvenuto sull'immagine */}
        <div className="absolute bottom-6 left-4 right-4">
          <p className="text-white/70 text-sm">{getGreeting()},</p>
          <h1 className="text-white font-black text-3xl tracking-tight leading-none">{firstName.toUpperCase()}</h1>
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto px-4 space-y-4 pb-24 pt-2">

        {/* Prossimo corso — card hero */}
        {nextBooking ? (
          <div className="relative rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#C0392B] to-[#7B1A10]" />
            <div className="absolute inset-0 opacity-10">
              <img src="/gym-sala.jpg" className="w-full h-full object-cover" />
            </div>
            <div className="relative p-4">
              <p className="text-white/60 text-xs uppercase tracking-widest font-bold mb-2">⚡ PROSSIMO CORSO</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-black text-xl leading-tight">{nextBooking.courseName.toUpperCase()}</p>
                  <p className="text-white/70 text-sm mt-1">{formatDate(nextBooking.date)} · {nextBooking.startTime}</p>
                </div>
                <span className="text-4xl">{COURSES_INFO[nextBooking.courseKey]?.emoji ?? '🏋️'}</span>
              </div>
            </div>
          </div>
        ) : (
          <button onClick={() => navigate({ page: 'COURSES' })}
            className="w-full relative rounded-2xl overflow-hidden">
            <img src="/gym-sala.jpg" className="w-full h-28 object-cover" />
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-2">
              <Dumbbell className="w-5 h-5 text-white" />
              <span className="text-white font-black text-lg">PRENOTA UN CORSO →</span>
            </div>
          </button>
        )}

        {/* Avvisi */}
        {avvisiSorted.length > 0 && (
          <div className="space-y-2">
            {avvisiSorted.slice(0, 2).map(avviso => (
              <div key={avviso.id} className={`border rounded-xl p-3 ${AVVISO_COLORS[avviso.type]}`}>
                <p className="font-bold text-sm">{avviso.pinned && '📌 '}{AVVISO_EMOJI[avviso.type]} {avviso.title}</p>
                <p className="text-xs opacity-70 mt-0.5">{avviso.message}</p>
              </div>
            ))}
          </div>
        )}

        {/* Abbonamento + azioni rapide */}
        <div className="grid grid-cols-2 gap-3">
          <div className={`rounded-2xl p-4 border ${isActive ? 'bg-white/5 border-white/10' : 'bg-red-500/10 border-red-500/30'}`}>
            <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Abbonamento</p>
            <p className="text-white font-bold text-sm">
              {user.membershipStatus === 'active' ? '✅ Attivo' :
               user.membershipStatus === 'trial' ? '🆕 Prova' :
               user.membershipStatus === 'expired' ? '❌ Scaduto' : '⏸️ Sospeso'}
            </p>
            {user.membershipExpiry && (
              <p className="text-white/30 text-xs mt-0.5">Scade {user.membershipExpiry.toLocaleDateString('it-IT')}</p>
            )}
          </div>
          <button onClick={() => navigate({ page: 'COURSES' })}
            className="rounded-2xl p-4 bg-[#C0392B] flex flex-col items-start justify-between">
            <Calendar className="w-5 h-5 text-white/70" />
            <p className="text-white font-black text-sm mt-2">CORSI<br/>SETTIMANA →</p>
          </button>
        </div>

        {/* Le mie prenotazioni */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white font-black text-base tracking-tight">LE MIE PRENOTAZIONI</h2>
            <button onClick={() => navigate({ page: 'COURSES' })}
              className="text-[#C0392B] text-xs font-bold flex items-center gap-0.5">
              + AGGIUNGI
            </button>
          </div>

          {loadingBookings ? (
            <div className="flex justify-center py-6">
              <div className="w-6 h-6 border-2 border-[#C0392B] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : bookings.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
              <p className="text-3xl mb-2">📅</p>
              <p className="text-white/40 text-sm">Nessuna prenotazione attiva</p>
              <button onClick={() => navigate({ page: 'COURSES' })}
                className="mt-3 bg-[#C0392B] text-white text-sm font-bold px-5 py-2 rounded-xl">
                Prenota ora
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {bookings.map(booking => {
                const info = COURSES_INFO[booking.courseKey] ?? { emoji: '🏋️' };
                const isToday = booking.date === today;
                const cancellable = canCancel(booking, settings);
                return (
                  <div key={booking.id}
                    className={`rounded-xl p-3 flex items-center gap-3 border ${
                      isToday ? 'bg-[#C0392B]/10 border-[#C0392B]/30' : 'bg-white/5 border-white/10'
                    }`}>
                    <span className="text-2xl">{info.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold text-sm truncate">{booking.courseName}</p>
                      <p className={`text-xs mt-0.5 ${isToday ? 'text-[#C0392B] font-bold' : 'text-white/40'}`}>
                        {formatDate(booking.date)} · {booking.startTime}
                      </p>
                      {!cancellable && <p className="text-white/20 text-xs">🔒 Non cancellabile</p>}
                    </div>
                    <button onClick={() => handleCancel(booking)}
                      disabled={cancelling === booking.id || !cancellable}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors flex-shrink-0 ${
                        !cancellable ? 'bg-white/5 text-white/20 cursor-not-allowed' :
                        'bg-white/10 hover:bg-red-500/20 text-white/30 hover:text-red-400'
                      }`}>
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

        {/* Info palestra — stile magazine */}
        <div className="rounded-2xl overflow-hidden border border-white/10">
          <div className="relative h-24 overflow-hidden">
            <img src="/gym-sala.jpg" className="w-full h-full object-cover object-top" />
            <div className="absolute inset-0 bg-black/50" />
            <div className="absolute inset-0 flex items-center px-4">
              <p className="text-white font-black text-lg tracking-tight">LA NOSTRA PALESTRA</p>
            </div>
          </div>
          <div className="bg-[#222] p-4 space-y-2">
            <a href={`https://maps.google.com/?q=Via+Nazionale+20+Eboli`} target="_blank"
              className="flex items-center gap-3 text-white/50 text-sm hover:text-white transition-colors">
              <MapPin className="w-4 h-4 text-[#C0392B] flex-shrink-0" />
              {BRAND.address}, {BRAND.city}
            </a>
            <a href={`tel:${BRAND.phone1}`}
              className="flex items-center gap-3 text-white/50 text-sm hover:text-white transition-colors">
              <Phone className="w-4 h-4 text-[#C0392B] flex-shrink-0" />
              {BRAND.phone1} / {BRAND.phone2}
            </a>
            <a href={BRAND.instagram} target="_blank"
              className="flex items-center gap-3 text-white/50 text-sm hover:text-white transition-colors">
              <Instagram className="w-4 h-4 text-[#C0392B] flex-shrink-0" />
              @ghimnatrotta
            </a>
            <div className="pt-2 border-t border-white/5 grid grid-cols-3 gap-2 text-center">
              <div><p className="text-white/30 text-xs">Lun–Ven</p><p className="text-white text-xs font-bold">07–22:15</p></div>
              <div><p className="text-white/30 text-xs">Sabato</p><p className="text-white text-xs font-bold">07–19:30</p></div>
              <div><p className="text-white/30 text-xs">Domenica</p><p className="text-red-400 text-xs font-bold">Chiuso</p></div>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom nav — stile premium */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#111]/95 backdrop-blur border-t border-white/10 px-4 py-3 flex justify-around">
        <button onClick={() => navigate({ page: 'DASHBOARD' })}
          className="flex flex-col items-center gap-1">
          <div className="w-8 h-8 bg-[#C0392B] rounded-xl flex items-center justify-center">
            <Dumbbell className="w-4 h-4 text-white" />
          </div>
          <span className="text-[#C0392B] text-xs font-bold">Home</span>
        </button>
        <button onClick={() => navigate({ page: 'COURSES' })}
          className="flex flex-col items-center gap-1 text-white/30 hover:text-white">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center">
            <Calendar className="w-4 h-4" />
          </div>
          <span className="text-xs">Corsi</span>
        </button>
        <button onClick={() => navigate({ page: 'PROFILE' })}
          className="flex flex-col items-center gap-1 text-white/30 hover:text-white">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center">
            <User className="w-4 h-4" />
          </div>
          <span className="text-xs">Profilo</span>
        </button>
        <button onClick={logout}
          className="flex flex-col items-center gap-1 text-white/30 hover:text-white">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center">
            <LogOut className="w-4 h-4" />
          </div>
          <span className="text-xs">Esci</span>
        </button>
      </div>
    </div>
  );
}