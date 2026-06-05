// ============================================================
// GHIMNA TROTTA 2.0 — pages/AdminPresenzePage.tsx
// Vista presenze giornaliere per l'admin
// ============================================================
import React, { useEffect, useState } from 'react';
import {
  collection, query, where, getDocs,
  addDoc, deleteDoc, doc, updateDoc,
  increment, serverTimestamp, getDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { RouteState } from '../types';
import { DAYS_IT, COURSES_INFO } from '../constants';
import { ArrowLeft, ChevronLeft, ChevronRight, Users, ChevronDown, Plus, X, Search, Phone, Mail } from 'lucide-react';

interface Props { navigate: (r: RouteState) => void; }

interface Slot {
  id: string;
  courseKey: string;
  courseName: string;
  startTime: string;
  endTime: string;
  room: string;
  trainerName: string;
  maxCapacity: number;
  currentBookings: number;
}

interface Booking {
  id: string;
  userId: string;
  userName: string;
  slotId: string;
  startTime: string;
  status: string;
}

interface Member {
  uid: string;
  displayName: string;
  email: string;
  phone?: string;
}

function formatDate(d: Date) {
  const today = new Date(); today.setHours(0,0,0,0);
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const target = new Date(d); target.setHours(0,0,0,0);
  if (target.getTime() === today.getTime()) return 'Oggi';
  if (target.getTime() === tomorrow.getTime()) return 'Domani';
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  if (target.getTime() === yesterday.getTime()) return 'Ieri';
  return `${DAYS_IT[d.getDay()]} ${d.getDate()}/${d.getMonth()+1}`;
}

export default function AdminPresenzePage({ navigate }: Props) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [slots, setSlots] = useState<Slot[]>([]);
  const [bookingsBySlot, setBookingsBySlot] = useState<Record<string, Booking[]>>({});
  const [expandedSlot, setExpandedSlot] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedMember, setSelectedMember] = useState<(Member & { bio?: string }) | null>(null);

  // Per aggiunta manuale
  const [addingToSlot, setAddingToSlot] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [addingMember, setAddingMember] = useState<string | null>(null);

  useEffect(() => { loadDayData(); }, [selectedDate]);

  function prevDay() {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d);
  }
  function nextDay() {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d);
  }

  async function loadMemberDetail(userId: string) {
    try {
      const snap = await getDoc(doc(db, 'users', userId));
      if (snap.exists()) {
        const d = snap.data();
        setSelectedMember({
          uid: snap.id,
          displayName: d.displayName,
          email: d.email,
          phone: d.phone,
          bio: d.bio,
        });
      }
    } catch (e) { console.error(e); }
  }

  async function loadDayData() {
    setLoading(true);
    setExpandedSlot(null);
    const dow = selectedDate.getDay();
    const dateStr = selectedDate.toISOString().split('T')[0];

    // Carica slot del giorno
    const slotsSnap = await getDocs(query(
      collection(db, 'slots'),
      where('dayOfWeek', '==', dow),
      where('isActive', '==', true)
    ));
    const slotsData = slotsSnap.docs
      .map(d => ({ id: d.id, ...d.data() } as Slot))
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
    setSlots(slotsData);

    // Carica prenotazioni del giorno
    const bookSnap = await getDocs(query(
      collection(db, 'bookings'),
      where('date', '==', dateStr),
      where('status', '==', 'confirmed')
    ));
    const map: Record<string, Booking[]> = {};
    bookSnap.docs.forEach(d => {
      const b = { id: d.id, ...d.data() } as Booking;
      if (!map[b.slotId]) map[b.slotId] = [];
      map[b.slotId].push(b);
    });
    setBookingsBySlot(map);
    setLoading(false);
  }

  async function loadMembers() {
    const snap = await getDocs(collection(db, 'users'));
    setMembers(snap.docs.map(d => ({ uid: d.id, ...d.data() } as Member)));
  }

  async function handleRemoveBooking(booking: Booking, slotId: string) {
    if (!confirm(`Rimuovere ${booking.userName} da questo corso?`)) return;
    await deleteDoc(doc(db, 'bookings', booking.id));
    await updateDoc(doc(db, 'slots', slotId), { currentBookings: increment(-1) });
    setBookingsBySlot(prev => ({
      ...prev,
      [slotId]: prev[slotId].filter(b => b.id !== booking.id)
    }));
    setSlots(prev => prev.map(s =>
      s.id === slotId ? { ...s, currentBookings: s.currentBookings - 1 } : s
    ));
  }

  async function handleAddMember(member: Member, slot: Slot) {
    const dateStr = selectedDate.toISOString().split('T')[0];
    // Controlla se già prenotato
    const existing = (bookingsBySlot[slot.id] ?? []).find(b => b.userId === member.uid);
    if (existing) { alert('Socio già iscritto a questo corso!'); return; }

    setAddingMember(member.uid);
    const ref = await addDoc(collection(db, 'bookings'), {
      userId: member.uid,
      userName: member.displayName,
      slotId: slot.id,
      courseKey: slot.courseKey,
      courseName: slot.courseName,
      date: dateStr,
      startTime: slot.startTime,
      status: 'confirmed',
      addedByAdmin: true,
      createdAt: serverTimestamp(),
    });
    await updateDoc(doc(db, 'slots', slot.id), { currentBookings: increment(1) });

    const newBooking: Booking = {
      id: ref.id,
      userId: member.uid,
      userName: member.displayName,
      slotId: slot.id,
      startTime: slot.startTime,
      status: 'confirmed',
    };
    setBookingsBySlot(prev => ({
      ...prev,
      [slot.id]: [...(prev[slot.id] ?? []), newBooking]
    }));
    setSlots(prev => prev.map(s =>
      s.id === slot.id ? { ...s, currentBookings: s.currentBookings + 1 } : s
    ));
    setAddingMember(null);
    setAddingToSlot(null);
    setMemberSearch('');
  }

  const filteredMembers = members.filter(m =>
    m.displayName.toLowerCase().includes(memberSearch.toLowerCase()) ||
    m.email.toLowerCase().includes(memberSearch.toLowerCase())
  );

  const totalBookings = Object.values(bookingsBySlot).reduce((sum, b) => sum + b.length, 0);

  return (
    <div className="min-h-screen bg-[#2C2C2C]">
      {/* Header */}
      <div className="bg-[#1a1a1a] px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate({ page: 'ADMIN' })} className="text-white/60 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-white font-bold text-lg">Presenze</h1>
      </div>

      {/* Selettore data */}
      <div className="bg-[#1a1a1a] px-4 pb-4 flex items-center justify-between">
        <button onClick={prevDay} className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center text-white/60 hover:text-white">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <p className="text-white font-black text-lg">{formatDate(selectedDate)}</p>
          <p className="text-white/40 text-xs">
            {selectedDate.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <button onClick={nextDay} className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center text-white/60 hover:text-white">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Stats giorno */}
      {!loading && (
        <div className="px-4 py-3 grid grid-cols-3 gap-2">
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
            <p className="text-white font-black text-xl">{slots.length}</p>
            <p className="text-white/40 text-xs">Corsi</p>
          </div>
          <div className="bg-[#C0392B]/10 border border-[#C0392B]/20 rounded-xl p-3 text-center">
            <p className="text-[#C0392B] font-black text-xl">{totalBookings}</p>
            <p className="text-white/40 text-xs">Prenotazioni</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
            <p className="text-white font-black text-xl">
              {slots.reduce((sum, s) => sum + s.maxCapacity, 0)}
            </p>
            <p className="text-white/40 text-xs">Posti totali</p>
          </div>
        </div>
      )}

      {/* Lista corsi */}
      <div className="px-4 pb-6 space-y-3">
        {loading ? (
          <div className="flex justify-center mt-12">
            <div className="w-8 h-8 border-2 border-[#C0392B] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : slots.length === 0 ? (
          <div className="text-center mt-12 text-white/30">
            <p className="text-4xl mb-3">😴</p>
            <p>Nessun corso in questo giorno</p>
          </div>
        ) : (
          slots.map(slot => {
            const info = COURSES_INFO[slot.courseKey] ?? { emoji: '🏋️' };
            const bookings = bookingsBySlot[slot.id] ?? [];
            const isExpanded = expandedSlot === slot.id;
            const isFull = slot.currentBookings >= slot.maxCapacity;
            const fillPct = Math.min((bookings.length / slot.maxCapacity) * 100, 100);

            return (
              <div key={slot.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                {/* Header slot */}
                <button
                  onClick={() => setExpandedSlot(isExpanded ? null : slot.id)}
                  className="w-full p-4 flex items-center gap-3 text-left">
                  <span className="text-2xl">{info.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-sm">{slot.courseName}</p>
                    <p className="text-white/40 text-xs">{slot.startTime}–{slot.endTime} · {slot.room}</p>
                    {slot.trainerName && (
                      <p className="text-white/30 text-xs">👤 {slot.trainerName}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-white/40" />
                      <span className={`text-sm font-black ${isFull ? 'text-red-400' : bookings.length > 0 ? 'text-white' : 'text-white/30'}`}>
                        {bookings.length}/{slot.maxCapacity}
                      </span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-white/30 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {/* Barra riempimento */}
                <div className="mx-4 mb-3 h-1 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${isFull ? 'bg-red-400' : fillPct > 70 ? 'bg-yellow-400' : 'bg-[#C0392B]'}`}
                    style={{ width: `${fillPct}%` }}
                  />
                </div>

                {/* Lista prenotati */}
                {isExpanded && (
                  <div className="border-t border-white/10 p-4 space-y-3">
                    {bookings.length === 0 ? (
                      <p className="text-white/30 text-sm text-center py-2">Nessuna prenotazione</p>
                    ) : (
                      <div className="space-y-2">
                        {bookings
                          .sort((a, b) => a.userName.localeCompare(b.userName))
                          .map((booking, i) => (
                          <div key={booking.id} className="flex items-center gap-3 bg-white/5 rounded-xl px-3 py-2">
                            <span className="text-white/30 text-xs w-5">{i + 1}</span>
                            <button
                              onClick={() => loadMemberDetail(booking.userId)}
                              className="text-white text-sm font-medium flex-1 text-left hover:text-[#C0392B] transition-colors">
                              {booking.userName}
                            </button>
                            <button
                              onClick={() => handleRemoveBooking(booking, slot.id)}
                              className="w-6 h-6 bg-red-500/10 hover:bg-red-500/20 rounded-lg flex items-center justify-center text-red-400 transition-colors">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Aggiungi socio manualmente */}
                    {!isFull && (
                      <div>
                        {addingToSlot === slot.id ? (
                          <div className="space-y-2">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                              <input
                                type="text"
                                placeholder="Cerca socio..."
                                value={memberSearch}
                                onChange={e => setMemberSearch(e.target.value)}
                                className="w-full bg-white/10 text-white placeholder-white/30 border border-white/20 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-[#C0392B]"
                                autoFocus
                              />
                            </div>
                            <div className="space-y-1 max-h-40 overflow-y-auto">
                              {filteredMembers.map(member => (
                                <button
                                  key={member.uid}
                                  onClick={() => handleAddMember(member, slot)}
                                  disabled={addingMember === member.uid}
                                  className="w-full flex items-center gap-3 bg-white/5 hover:bg-white/10 rounded-xl px-3 py-2 text-left transition-colors">
                                  <div className="w-7 h-7 rounded-full bg-[#C0392B]/20 flex items-center justify-center text-xs font-bold text-[#C0392B]">
                                    {member.displayName.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-white text-sm truncate">{member.displayName}</p>
                                    <p className="text-white/30 text-xs truncate">{member.email}</p>
                                  </div>
                                  {addingMember === member.uid && (
                                    <div className="w-4 h-4 border border-white/30 border-t-transparent rounded-full animate-spin" />
                                  )}
                                </button>
                              ))}
                            </div>
                            <button
                              onClick={() => { setAddingToSlot(null); setMemberSearch(''); }}
                              className="w-full text-white/30 text-xs py-1">
                              Annulla
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setAddingToSlot(slot.id); loadMembers(); }}
                            className="w-full border border-dashed border-white/20 rounded-xl py-2 flex items-center justify-center gap-2 text-white/40 hover:text-white/60 hover:border-white/30 transition-colors text-sm">
                            <Plus className="w-4 h-4" /> Aggiungi socio
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    {/* Modal profilo socio */}
      {selectedMember && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end">
          <div className="bg-[#1e1e1e] w-full rounded-t-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-bold text-lg">Profilo Socio</h2>
              <button onClick={() => setSelectedMember(null)} className="text-white/40 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 rounded-full bg-[#C0392B]/20 flex items-center justify-center flex-shrink-0">
                <span className="text-[#C0392B] font-black text-2xl">{selectedMember.displayName.charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <p className="text-white font-black text-lg">{selectedMember.displayName}</p>
                {selectedMember.bio && <p className="text-white/40 text-xs mt-0.5">{selectedMember.bio}</p>}
              </div>
            </div>

            <div className="space-y-3">
              {selectedMember.phone ? (
                <a href={`tel:${selectedMember.phone}`}
                  className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3 hover:bg-white/10 transition-colors">
                  <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <Phone className="w-4 h-4 text-green-400" />
                  </div>
                  <div>
                    <p className="text-white/40 text-xs">Telefono</p>
                    <p className="text-white font-bold">{selectedMember.phone}</p>
                  </div>
                  <span className="ml-auto text-green-400 text-xs font-bold">Chiama →</span>
                </a>
              ) : (
                <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3 opacity-40">
                  <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                    <Phone className="w-4 h-4 text-white/40" />
                  </div>
                  <p className="text-white/40 text-sm">Nessun numero inserito</p>
                </div>
              )}

              <a href={`mailto:${selectedMember.email}`}
                className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3 hover:bg-white/10 transition-colors">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Mail className="w-4 h-4 text-blue-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-white/40 text-xs">Email</p>
                  <p className="text-white font-bold text-sm truncate">{selectedMember.email}</p>
                </div>
                <span className="ml-auto text-blue-400 text-xs font-bold flex-shrink-0">Scrivi →</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}