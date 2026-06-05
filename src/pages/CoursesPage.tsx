// ============================================================
// GHIMNA TROTTA 2.0 — pages/CoursesPage.tsx
// Con filtri, 2 settimane, foto e dettaglio corso
// ============================================================

import React, { useEffect, useState } from 'react';
import {
  collection, query, where, getDocs,
  doc, addDoc, deleteDoc, updateDoc,
  increment, serverTimestamp, getDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { RouteState } from '../types';
import { DAYS_IT, COURSES_INFO } from '../constants';
import { ChevronLeft, ChevronRight, Clock, Users, AlertCircle, X, Filter } from 'lucide-react';

interface Props { navigate: (r: RouteState) => void; }

interface Slot {
  id: string;
  courseKey: string;
  courseName: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room: string;
  trainerName: string;
  trainerId?: string;
  maxCapacity: number;
  currentBookings: number;
}

interface TrainerProfile {
  uid: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  specialties?: string[];
}

interface GymSettings {
  cancellationEnabled: boolean;
  cancellationHoursLimit: number;
}

// Genera 2 settimane di giorni (lun-sab)
function getTwoWeeks() {
  const today = new Date();
  const day = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function isSameDay(d1: Date, d2: Date) {
  return d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear();
}

function canCancel(slot: Slot, selectedDate: Date, settings: GymSettings): boolean {
  if (!settings.cancellationEnabled) return true;
  const [h, m] = slot.startTime.split(':').map(Number);
  const courseDateTime = new Date(selectedDate);
  courseDateTime.setHours(h, m, 0, 0);
  const limitMs = settings.cancellationHoursLimit * 60 * 60 * 1000;
  return new Date().getTime() < courseDateTime.getTime() - limitMs;
}

export default function CoursesPage({ navigate }: Props) {
  const { user } = useAuth();
  const allDays = getTwoWeeks();
  const today = new Date();

  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [myBookings, setMyBookings] = useState<Record<string, string>>({});
  const [myWaitlist, setMyWaitlist] = useState<Record<string, string>>({});
  const [settings, setSettings] = useState<GymSettings>({ cancellationEnabled: true, cancellationHoursLimit: 2 });
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Filtri
  const [filterCourse, setFilterCourse] = useState<string>('');
  const [filterTrainer, setFilterTrainer] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  // Dettaglio corso
  const [detailSlot, setDetailSlot] = useState<Slot | null>(null);
  const [trainerProfile, setTrainerProfile] = useState<TrainerProfile | null>(null);
  const [showTrainerProfile, setShowTrainerProfile] = useState(false);

  useEffect(() => { loadSlots(); }, [selectedDate]);
  useEffect(() => { if (user) loadMyStatus(); }, [user, selectedDate]);
  useEffect(() => {
    async function loadSettings() {
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
    }
    loadSettings();
  }, []);

  async function loadSlots() {
    setLoading(true);
    try {
      const dow = selectedDate.getDay();
      const q = query(
        collection(db, 'slots'),
        where('dayOfWeek', '==', dow),
        where('isActive', '==', true)
      );
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Slot));
      data.sort((a, b) => a.startTime.localeCompare(b.startTime));
      setSlots(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function loadMyStatus() {
    if (!user) return;
    const dateStr = selectedDate.toISOString().split('T')[0];
    const bSnap = await getDocs(query(
      collection(db, 'bookings'),
      where('userId', '==', user.uid),
      where('date', '==', dateStr),
      where('status', '==', 'confirmed')
    ));
    const bMap: Record<string, string> = {};
    bSnap.docs.forEach(d => { bMap[d.data().slotId] = d.id; });
    setMyBookings(bMap);

    const wSnap = await getDocs(query(
      collection(db, 'waitlist'),
      where('userId', '==', user.uid),
      where('date', '==', dateStr)
    ));
    const wMap: Record<string, string> = {};
    wSnap.docs.forEach(d => { wMap[d.data().slotId] = d.id; });
    setMyWaitlist(wMap);
  }

  async function loadTrainerProfile(trainerId: string) {
    try {
      const snap = await getDoc(doc(db, 'users', trainerId));
      if (snap.exists()) {
        const data = snap.data();
        setTrainerProfile({ uid: snap.id, displayName: data.displayName, avatarUrl: data.avatarUrl, bio: data.bio, specialties: data.specialties });
        setShowTrainerProfile(true);
      }
    } catch (e) { console.error(e); }
  }

  async function handleBook(slot: Slot) {
    if (!user || actionInProgress) return;
    setActionInProgress(slot.id);
    setErrorMsg('');
    const dateStr = selectedDate.toISOString().split('T')[0];
    try {
      const alreadyBooked = myBookings[slot.id];
      const alreadyWaiting = myWaitlist[slot.id];

      if (alreadyBooked) {
        if (!canCancel(slot, selectedDate, settings)) {
          setErrorMsg(`Non puoi cancellare meno di ${settings.cancellationHoursLimit} ore prima del corso.`);
          setTimeout(() => setErrorMsg(''), 4000);
          setActionInProgress(null);
          return;
        }
        await deleteDoc(doc(db, 'bookings', alreadyBooked));
        await updateDoc(doc(db, 'slots', slot.id), { currentBookings: increment(-1) });
        await notifyFirstInWaitlist(slot, dateStr);
        setMyBookings(prev => { const n = { ...prev }; delete n[slot.id]; return n; });
        setSlots(prev => prev.map(s => s.id === slot.id ? { ...s, currentBookings: s.currentBookings - 1 } : s));
        showSuccess('Prenotazione cancellata');
      } else if (alreadyWaiting) {
        await deleteDoc(doc(db, 'waitlist', alreadyWaiting));
        setMyWaitlist(prev => { const n = { ...prev }; delete n[slot.id]; return n; });
        showSuccess("Rimosso dalla lista d'attesa");
      } else if (slot.currentBookings >= slot.maxCapacity) {
        const wSnap = await getDocs(query(
          collection(db, 'waitlist'),
          where('slotId', '==', slot.id),
          where('date', '==', dateStr)
        ));
        const position = wSnap.size + 1;
        const wRef = await addDoc(collection(db, 'waitlist'), {
          userId: user.uid, userName: user.displayName,
          slotId: slot.id, courseKey: slot.courseKey, courseName: slot.courseName,
          date: dateStr, startTime: slot.startTime, position,
          createdAt: serverTimestamp(),
        });
        setMyWaitlist(prev => ({ ...prev, [slot.id]: wRef.id }));
        showSuccess(`Sei in lista d'attesa (posizione ${position})`);
      } else {
        const bRef = await addDoc(collection(db, 'bookings'), {
          userId: user.uid, userName: user.displayName,
          slotId: slot.id, courseKey: slot.courseKey, courseName: slot.courseName,
          date: dateStr, startTime: slot.startTime, status: 'confirmed',
          createdAt: serverTimestamp(),
        });
        await updateDoc(doc(db, 'slots', slot.id), { currentBookings: increment(1) });
        setMyBookings(prev => ({ ...prev, [slot.id]: bRef.id }));
        setSlots(prev => prev.map(s => s.id === slot.id ? { ...s, currentBookings: s.currentBookings + 1 } : s));
        showSuccess('Prenotazione confermata! ✅');
      }
    } catch (e) { console.error(e); }
    setActionInProgress(null);
    setDetailSlot(null);
  }

  async function notifyFirstInWaitlist(slot: Slot, dateStr: string) {
    const wSnap = await getDocs(query(
      collection(db, 'waitlist'),
      where('slotId', '==', slot.id),
      where('date', '==', dateStr)
    ));
    if (wSnap.empty) return;
    const sorted = wSnap.docs.map(d => ({ id: d.id, ...d.data() } as any)).sort((a, b) => a.position - b.position);
    const first = sorted[0];
    await addDoc(collection(db, 'notifications'), {
      userId: first.userId, type: 'waitlist_available',
      title: '🎉 Posto disponibile!',
      message: `Si è liberato un posto per ${slot.courseName} (${slot.startTime}). Prenota subito!`,
      slotId: slot.id, date: dateStr, read: false, createdAt: serverTimestamp(),
    });
  }

  function showSuccess(msg: string) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  }

  const isPast = (slot: Slot) => {
    if (!isSameDay(selectedDate, today)) return selectedDate < today;
    const [h, m] = slot.startTime.split(':').map(Number);
    const slotDate = new Date();
    slotDate.setHours(h, m, 0, 0);
    return slotDate < new Date();
  };

  // Ottieni istruttori unici dagli slot
  const trainers = [...new Set(slots.map(s => s.trainerName).filter(Boolean))];
  const courseKeys = [...new Set(slots.map(s => s.courseKey))];

  // Applica filtri
  const filteredSlots = slots.filter(slot => {
    if (filterCourse && slot.courseKey !== filterCourse) return false;
    if (filterTrainer && slot.trainerName !== filterTrainer) return false;
    return true;
  });

  const hasActiveFilters = filterCourse || filterTrainer;

  // Settimana corrente (0-5) e prossima (6-11)
  const week1 = allDays.slice(0, 6);
  const week2 = allDays.slice(6, 12);
  const isWeek2 = allDays.slice(6).some(d => isSameDay(d, selectedDate));

  return (
    <div className="min-h-screen bg-[#2C2C2C] flex flex-col">
      {/* Header */}
      <div className="bg-[#1a1a1a] px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate({ page: 'DASHBOARD' })} className="text-white/60 hover:text-white">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-white font-bold text-lg flex-1">Corsi</h1>
        <button onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
            hasActiveFilters ? 'bg-[#C0392B] text-white' : 'bg-white/10 text-white/60'
          }`}>
          <Filter className="w-3.5 h-3.5" />
          Filtri {hasActiveFilters && '●'}
        </button>
      </div>

      {/* Filtri */}
      {showFilters && (
        <div className="bg-[#1a1a1a] px-4 pb-4 space-y-3 border-b border-white/5">
          {/* Tipo corso */}
          <div>
            <p className="text-white/40 text-xs mb-2">Tipo corso</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button onClick={() => setFilterCourse('')}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold ${!filterCourse ? 'bg-[#C0392B] text-white' : 'bg-white/10 text-white/50'}`}>
                Tutti
              </button>
              {courseKeys.map(key => {
                const info = COURSES_INFO[key] ?? { label: key, emoji: '🏋️' };
                return (
                  <button key={key} onClick={() => setFilterCourse(filterCourse === key ? '' : key)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 ${filterCourse === key ? 'bg-[#C0392B] text-white' : 'bg-white/10 text-white/50'}`}>
                    {info.emoji} {info.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Istruttore */}
          {trainers.length > 0 && (
            <div>
              <p className="text-white/40 text-xs mb-2">Istruttore</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                <button onClick={() => setFilterTrainer('')}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold ${!filterTrainer ? 'bg-[#C0392B] text-white' : 'bg-white/10 text-white/50'}`}>
                  Tutti
                </button>
                {trainers.map(t => (
                  <button key={t} onClick={() => setFilterTrainer(filterTrainer === t ? '' : t)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold ${filterTrainer === t ? 'bg-[#C0392B] text-white' : 'bg-white/10 text-white/50'}`}>
                    👤 {t}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Selettore settimane */}
      <div className="bg-[#1a1a1a] border-b border-white/5">
        {/* Tab settimane */}
        <div className="flex px-4 pt-2 gap-4">
          <button onClick={() => setSelectedDate(week1.find(d => d >= today) ?? week1[0])}
            className={`text-xs font-bold pb-2 border-b-2 transition-colors ${!isWeek2 ? 'border-[#C0392B] text-white' : 'border-transparent text-white/30'}`}>
            Questa settimana
          </button>
          <button onClick={() => setSelectedDate(week2[0])}
            className={`text-xs font-bold pb-2 border-b-2 transition-colors ${isWeek2 ? 'border-[#C0392B] text-white' : 'border-transparent text-white/30'}`}>
            Prossima settimana
          </button>
        </div>

        {/* Giorni della settimana attiva */}
        <div className="px-2 pb-3 flex gap-1 overflow-x-auto">
          {(isWeek2 ? week2 : week1).map((date, i) => {
            const isSelected = isSameDay(date, selectedDate);
            const isToday = isSameDay(date, today);
            const isPastDay = date < today && !isToday;
            return (
              <button key={i} onClick={() => setSelectedDate(date)}
                className={`flex flex-col items-center min-w-[48px] py-2 px-1 rounded-xl transition-colors ${
                  isSelected ? 'bg-[#C0392B] text-white' :
                  isPastDay ? 'text-white/20' : 'text-white/60 hover:text-white'
                }`}>
                <span className="text-xs font-medium">{DAYS_IT[date.getDay()]}</span>
                <span className={`text-lg font-black ${isToday && !isSelected ? 'text-[#C0392B]' : ''}`}>
                  {date.getDate()}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {successMsg && (
        <div className="mx-4 mt-3 bg-green-500/20 border border-green-500/40 text-green-300 text-sm px-4 py-2 rounded-xl text-center">
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="mx-4 mt-3 bg-red-500/20 border border-red-500/40 text-red-300 text-sm px-4 py-2 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />{errorMsg}
        </div>
      )}

      {/* Lista slot */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center mt-16">
            <div className="w-8 h-8 border-2 border-[#C0392B] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredSlots.length === 0 ? (
          <div className="text-center mt-16 text-white/30">
            <p className="text-4xl mb-3">{hasActiveFilters ? '🔍' : '😴'}</p>
            <p className="font-medium">{hasActiveFilters ? 'Nessun corso con questi filtri' : 'Nessun corso oggi'}</p>
            {hasActiveFilters && (
              <button onClick={() => { setFilterCourse(''); setFilterTrainer(''); }}
                className="mt-3 text-[#C0392B] text-sm font-semibold">
                Rimuovi filtri
              </button>
            )}
          </div>
        ) : (
          filteredSlots.map(slot => {
            const info = COURSES_INFO[slot.courseKey] ?? { emoji: '🏋️', label: slot.courseName, image: '', color: '#C0392B', description: '' };
            const booked = !!myBookings[slot.id];
            const waiting = !!myWaitlist[slot.id];
            const full = slot.currentBookings >= slot.maxCapacity;
            const past = isPast(slot);
            const spots = slot.maxCapacity - slot.currentBookings;
            const cancellable = canCancel(slot, selectedDate, settings);

            return (
              <div key={slot.id}
                onClick={() => setDetailSlot(slot)}
                className={`rounded-2xl border overflow-hidden transition-all cursor-pointer ${
                  booked ? 'border-[#C0392B]/40' :
                  waiting ? 'border-yellow-500/30' :
                  'border-white/10'
                }`}>
                {/* Foto corso */}
                {info.image && (
                  <div className="relative h-32 overflow-hidden">
                    <img src={info.image} alt={info.label} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between">
                      <div>
                        <p className="text-white font-black text-base leading-tight">{slot.courseName}</p>
                        {slot.room && <p className="text-white/60 text-xs">{slot.room}</p>}
                      </div>
                      {booked && <span className="bg-[#C0392B] text-white text-xs font-bold px-2 py-0.5 rounded-lg">Prenotato</span>}
                      {waiting && <span className="bg-yellow-500 text-black text-xs font-bold px-2 py-0.5 rounded-lg">In attesa</span>}
                    </div>
                  </div>
                )}

                {/* Info slot */}
                <div className={`p-3 flex items-center justify-between gap-3 ${
                  booked ? 'bg-[#C0392B]/10' : waiting ? 'bg-yellow-500/10' : 'bg-white/5'
                }`}>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {!info.image && <span className="text-2xl">{info.emoji}</span>}
                    <div className="min-w-0">
                      {!info.image && <p className="text-white font-bold text-sm truncate">{slot.courseName}</p>}
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="flex items-center gap-1 text-white/50 text-xs">
                          <Clock className="w-3 h-3" />{slot.startTime} – {slot.endTime}
                        </span>
                        <span className="flex items-center gap-1 text-white/50 text-xs">
                          <Users className="w-3 h-3" />
                          {full ? <span className="text-red-400">Completo</span> :
                            <span className={spots <= 3 ? 'text-yellow-400' : ''}>{spots} {spots === 1 ? 'posto' : 'posti'}</span>}
                        </span>
                      </div>
                      {slot.trainerName && <p className="text-white/30 text-xs">👤 {slot.trainerName}</p>}
                    </div>
                  </div>

                  {!past ? (
                    <button
                      onClick={e => { e.stopPropagation(); handleBook(slot); }}
                      disabled={actionInProgress === slot.id || (booked && !cancellable)}
                      className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                        booked && !cancellable ? 'bg-white/5 border border-white/10 text-white/20 cursor-not-allowed' :
                        booked ? 'bg-[#C0392B]/20 text-[#C0392B] border border-[#C0392B]/40' :
                        waiting ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                        full ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                        'bg-[#C0392B] text-white hover:bg-[#96281B]'
                      }`}>
                      {actionInProgress === slot.id
                        ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        : booked && !cancellable ? '🔒'
                        : booked ? 'Annulla'
                        : waiting ? 'Esci lista'
                        : full ? '⏳ Attesa'
                        : 'Prenota'}
                    </button>
                  ) : (
                    <span className="text-white/20 text-xs flex-shrink-0">Passato</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal dettaglio corso */}
      {detailSlot && (() => {
        const info = COURSES_INFO[detailSlot.courseKey] ?? { emoji: '🏋️', label: detailSlot.courseName, image: '', color: '#C0392B', description: '' };
        const booked = !!myBookings[detailSlot.id];
        const waiting = !!myWaitlist[detailSlot.id];
        const full = detailSlot.currentBookings >= detailSlot.maxCapacity;
        const past = isPast(detailSlot);
        const cancellable = canCancel(detailSlot, selectedDate, settings);
        const spots = detailSlot.maxCapacity - detailSlot.currentBookings;
        return (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-end">
            <div className="bg-[#1e1e1e] w-full rounded-t-2xl overflow-hidden max-h-[85vh] flex flex-col">
              {/* Foto */}
              {info.image && (
                <div className="relative h-48 flex-shrink-0">
                  <img src={info.image} alt={info.label} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <button onClick={() => setDetailSlot(null)}
                    className="absolute top-3 right-3 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {!info.image && (
                  <div className="flex items-center justify-between">
                    <span className="text-4xl">{info.emoji}</span>
                    <button onClick={() => setDetailSlot(null)} className="text-white/40 hover:text-white">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                )}

                <div>
                  <h2 className="text-white font-black text-2xl">{detailSlot.courseName}</h2>
                  {detailSlot.room && <p className="text-white/40 text-sm">{detailSlot.room}</p>}
                </div>

                {info.description && (
                  <p className="text-white/60 text-sm leading-relaxed">{info.description}</p>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/5 rounded-xl p-3">
                    <p className="text-white/40 text-xs mb-1">Orario</p>
                    <p className="text-white font-bold">{detailSlot.startTime} – {detailSlot.endTime}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3">
                    <p className="text-white/40 text-xs mb-1">Posti</p>
                    <p className={`font-bold ${full ? 'text-red-400' : spots <= 3 ? 'text-yellow-400' : 'text-white'}`}>
                      {full ? 'Completo' : `${spots} disponibili`}
                    </p>
                  </div>
                  {detailSlot.trainerName && (
                    <button
                      onClick={() => detailSlot.trainerId ? loadTrainerProfile(detailSlot.trainerId) : null}
                      className={`bg-white/5 rounded-xl p-3 col-span-2 text-left w-full ${detailSlot.trainerId ? 'hover:bg-white/10 transition-colors' : ''}`}>
                      <p className="text-white/40 text-xs mb-2">Istruttore</p>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#4A4A4A] flex items-center justify-center flex-shrink-0 overflow-hidden">
                          <span className="text-white font-bold text-sm">{detailSlot.trainerName.charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="text-white font-bold">{detailSlot.trainerName}</p>
                          {detailSlot.trainerId && <p className="text-white/30 text-xs">Tocca per vedere il profilo →</p>}
                        </div>
                      </div>
                    </button>
                  )}
                </div>

                {!past && (
                  <button
                    onClick={() => handleBook(detailSlot)}
                    disabled={actionInProgress === detailSlot.id || (booked && !cancellable)}
                    className={`w-full py-4 rounded-2xl font-bold text-base transition-all ${
                      booked && !cancellable ? 'bg-white/5 text-white/20 cursor-not-allowed' :
                      booked ? 'bg-[#C0392B]/20 text-[#C0392B] border border-[#C0392B]/40' :
                      waiting ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                      full ? 'bg-yellow-500 text-black' :
                      'bg-[#C0392B] text-white hover:bg-[#96281B]'
                    }`}>
                    {actionInProgress === detailSlot.id
                      ? 'Caricamento...'
                      : booked && !cancellable ? '🔒 Cancellazione non disponibile'
                      : booked ? 'Annulla prenotazione'
                      : waiting ? "Esci dalla lista d'attesa"
                      : full ? "⏳ Entra in lista d'attesa"
                      : 'Prenota questo corso'}
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal profilo istruttore */}
      {showTrainerProfile && trainerProfile && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-end">
          <div className="bg-[#1e1e1e] w-full rounded-t-2xl p-5 max-h-[70vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-bold text-lg">Profilo Istruttore</h2>
              <button onClick={() => setShowTrainerProfile(false)} className="text-white/40 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-4 mb-5">
              <div className="w-16 h-16 rounded-full bg-[#4A4A4A] flex-shrink-0 flex items-center justify-center overflow-hidden">
                {trainerProfile.avatarUrl
                  ? <img src={trainerProfile.avatarUrl} className="w-full h-full object-cover" />
                  : <span className="text-white font-black text-2xl">{trainerProfile.displayName.charAt(0).toUpperCase()}</span>
                }
              </div>
              <div>
                <p className="text-white font-black text-xl">{trainerProfile.displayName}</p>
                <p className="text-[#C0392B] text-sm font-medium">💪 Istruttore</p>
              </div>
            </div>

            {trainerProfile.bio && (
              <div className="mb-4">
                <p className="text-white/40 text-xs uppercase tracking-widest mb-2">Bio</p>
                <p className="text-white/70 text-sm leading-relaxed">{trainerProfile.bio}</p>
              </div>
            )}

            {trainerProfile.specialties && trainerProfile.specialties.length > 0 && (
              <div>
                <p className="text-white/40 text-xs uppercase tracking-widest mb-2">Specialità</p>
                <div className="flex flex-wrap gap-2">
                  {trainerProfile.specialties.map(key => {
                    const info = COURSES_INFO[key];
                    if (!info) return null;
                    return (
                      <span key={key} className="px-3 py-1.5 bg-[#C0392B]/10 border border-[#C0392B]/20 text-[#C0392B] text-xs font-bold rounded-xl">
                        {info.emoji} {info.label}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {!trainerProfile.bio && (!trainerProfile.specialties || trainerProfile.specialties.length === 0) && (
              <p className="text-white/30 text-sm text-center py-4">Nessuna informazione disponibile</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}