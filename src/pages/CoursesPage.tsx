// ============================================================
// GHIMNA TROTTA 2.0 — pages/CoursesPage.tsx
// Con supporto lista d'attesa
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
import { ChevronLeft, ChevronRight, Clock, Users, AlertCircle } from 'lucide-react';

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
  maxCapacity: number;
  currentBookings: number;
}

function getWeekDays() {
  const today = new Date();
  const day = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
  return Array.from({ length: 6 }, (_, i) => {
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

export default function CoursesPage({ navigate }: Props) {
  const { user } = useAuth();
  const weekDays = getWeekDays();
  const today = new Date();

  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [myBookings, setMyBookings] = useState<Record<string, string>>({}); // slotId -> bookingId
  const [myWaitlist, setMyWaitlist] = useState<Record<string, string>>({}); // slotId -> waitlistId
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => { loadSlots(); }, [selectedDate]);
  useEffect(() => { if (user) loadMyStatus(); }, [user, selectedDate]);

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

    // Prenotazioni confermate
    const bSnap = await getDocs(query(
      collection(db, 'bookings'),
      where('userId', '==', user.uid),
      where('date', '==', dateStr),
      where('status', '==', 'confirmed')
    ));
    const bMap: Record<string, string> = {};
    bSnap.docs.forEach(d => { bMap[d.data().slotId] = d.id; });
    setMyBookings(bMap);

    // Lista d'attesa
    const wSnap = await getDocs(query(
      collection(db, 'waitlist'),
      where('userId', '==', user.uid),
      where('date', '==', dateStr)
    ));
    const wMap: Record<string, string> = {};
    wSnap.docs.forEach(d => { wMap[d.data().slotId] = d.id; });
    setMyWaitlist(wMap);
  }

  async function handleBook(slot: Slot) {
    if (!user || actionInProgress) return;
    setActionInProgress(slot.id);
    const dateStr = selectedDate.toISOString().split('T')[0];

    try {
      const alreadyBooked = myBookings[slot.id];
      const alreadyWaiting = myWaitlist[slot.id];

      if (alreadyBooked) {
        // Cancella prenotazione
        await deleteDoc(doc(db, 'bookings', alreadyBooked));
        await updateDoc(doc(db, 'slots', slot.id), { currentBookings: increment(-1) });

        // Avvisa il primo in lista d'attesa
        await notifyFirstInWaitlist(slot, dateStr);

        setMyBookings(prev => { const n = { ...prev }; delete n[slot.id]; return n; });
        setSlots(prev => prev.map(s => s.id === slot.id ? { ...s, currentBookings: s.currentBookings - 1 } : s));
        showSuccess('Prenotazione cancellata');

      } else if (alreadyWaiting) {
        // Esci dalla lista d'attesa
        await deleteDoc(doc(db, 'waitlist', alreadyWaiting));
        setMyWaitlist(prev => { const n = { ...prev }; delete n[slot.id]; return n; });
        showSuccess('Rimosso dalla lista d\'attesa');

      } else if (slot.currentBookings >= slot.maxCapacity) {
        // Entra in lista d'attesa
        const wSnap = await getDocs(query(
          collection(db, 'waitlist'),
          where('slotId', '==', slot.id),
          where('date', '==', dateStr)
        ));
        const position = wSnap.size + 1;

        const wRef = await addDoc(collection(db, 'waitlist'), {
          userId: user.uid,
          userName: user.displayName,
          slotId: slot.id,
          courseKey: slot.courseKey,
          courseName: slot.courseName,
          date: dateStr,
          startTime: slot.startTime,
          position,
          createdAt: serverTimestamp(),
        });
        setMyWaitlist(prev => ({ ...prev, [slot.id]: wRef.id }));
        showSuccess(`Sei in lista d'attesa (posizione ${position})`);

      } else {
        // Prenota
        const bRef = await addDoc(collection(db, 'bookings'), {
          userId: user.uid,
          userName: user.displayName,
          slotId: slot.id,
          courseKey: slot.courseKey,
          courseName: slot.courseName,
          date: dateStr,
          startTime: slot.startTime,
          status: 'confirmed',
          createdAt: serverTimestamp(),
        });
        await updateDoc(doc(db, 'slots', slot.id), { currentBookings: increment(1) });
        setMyBookings(prev => ({ ...prev, [slot.id]: bRef.id }));
        setSlots(prev => prev.map(s => s.id === slot.id ? { ...s, currentBookings: s.currentBookings + 1 } : s));
        showSuccess('Prenotazione confermata! ✅');
      }
    } catch (e) { console.error(e); }
    setActionInProgress(null);
  }

  async function notifyFirstInWaitlist(slot: Slot, dateStr: string) {
    // Trova il primo in lista d'attesa
    const wSnap = await getDocs(query(
      collection(db, 'waitlist'),
      where('slotId', '==', slot.id),
      where('date', '==', dateStr)
    ));
    if (wSnap.empty) return;

    // Ordina per posizione e prendi il primo
    const sorted = wSnap.docs
      .map(d => ({ id: d.id, ...d.data() } as any))
      .sort((a, b) => a.position - b.position);
    const first = sorted[0];

    // Crea notifica in-app per il primo in lista
    await addDoc(collection(db, 'notifications'), {
      userId: first.userId,
      type: 'waitlist_available',
      title: '🎉 Posto disponibile!',
      message: `Si è liberato un posto per ${slot.courseName} (${slot.startTime}). Prenota subito!`,
      slotId: slot.id,
      date: dateStr,
      read: false,
      createdAt: serverTimestamp(),
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

  return (
    <div className="min-h-screen bg-[#2C2C2C] flex flex-col">
      {/* Header */}
      <div className="bg-[#1a1a1a] px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate({ page: 'DASHBOARD' })} className="text-white/60 hover:text-white">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-white font-bold text-lg">Corsi</h1>
      </div>

      {/* Selettore giorni */}
      <div className="bg-[#1a1a1a] px-2 pb-3 flex gap-1 overflow-x-auto">
        {weekDays.map((date, i) => {
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

      {/* Success message */}
      {successMsg && (
        <div className="mx-4 mt-3 bg-green-500/20 border border-green-500/40 text-green-300 text-sm px-4 py-2 rounded-xl text-center">
          {successMsg}
        </div>
      )}

      {/* Lista slot */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center mt-16">
            <div className="w-8 h-8 border-2 border-[#C0392B] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : slots.length === 0 ? (
          <div className="text-center mt-16 text-white/30">
            <p className="text-4xl mb-3">😴</p>
            <p className="font-medium">Nessun corso oggi</p>
            <p className="text-xs mt-1">Seleziona un altro giorno</p>
          </div>
        ) : (
          slots.map(slot => {
            const info = COURSES_INFO[slot.courseKey] ?? { emoji: '🏋️', label: slot.courseName };
            const booked = !!myBookings[slot.id];
            const waiting = !!myWaitlist[slot.id];
            const full = slot.currentBookings >= slot.maxCapacity;
            const past = isPast(slot);
            const spots = slot.maxCapacity - slot.currentBookings;

            return (
              <div key={slot.id}
                className={`rounded-2xl border p-4 transition-all ${
                  booked ? 'bg-[#C0392B]/10 border-[#C0392B]/40' :
                  waiting ? 'bg-yellow-500/10 border-yellow-500/30' :
                  'bg-white/5 border-white/10'
                }`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <span className="text-2xl mt-0.5">{info.emoji}</span>
                    <div className="flex-1">
                      <p className="text-white font-bold">{slot.courseName}</p>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="flex items-center gap-1 text-white/50 text-xs">
                          <Clock className="w-3 h-3" />
                          {slot.startTime} – {slot.endTime}
                        </span>
                        <span className="flex items-center gap-1 text-white/50 text-xs">
                          <Users className="w-3 h-3" />
                          {full ? (
                            <span className="text-red-400">Completo</span>
                          ) : (
                            <span className={spots <= 3 ? 'text-yellow-400' : ''}>
                              {spots} {spots === 1 ? 'posto' : 'posti'}
                            </span>
                          )}
                        </span>
                        {slot.room && (
                          <span className="text-white/30 text-xs">{slot.room}</span>
                        )}
                      </div>
                      {slot.trainerName && (
                        <p className="text-white/30 text-xs mt-1">👤 {slot.trainerName}</p>
                      )}
                      {waiting && (
                        <p className="text-yellow-400 text-xs mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Sei in lista d'attesa
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Bottone azione */}
                  {!past ? (
                    <button
                      onClick={() => handleBook(slot)}
                      disabled={actionInProgress === slot.id}
                      className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                        booked
                          ? 'bg-[#C0392B]/20 text-[#C0392B] border border-[#C0392B]/40'
                          : waiting
                          ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                          : full
                          ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                          : 'bg-[#C0392B] text-white hover:bg-[#96281B]'
                      }`}>
                      {actionInProgress === slot.id ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : booked ? 'Annulla'
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
    </div>
  );
}