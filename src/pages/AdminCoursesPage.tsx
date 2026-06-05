// ============================================================
// GHIMNA TROTTA 2.0 — pages/AdminCoursesPage.tsx
// ============================================================

import React, { useEffect, useState } from 'react';
import {
  collection, getDocs, addDoc, updateDoc,
  deleteDoc, doc, serverTimestamp, query, where
} from 'firebase/firestore';
import { db } from '../firebase';
import { RouteState } from '../types';
import { DAYS_IT, COURSES_INFO } from '../constants';
import { ArrowLeft, Plus, Trash2, Edit2, Check, X, Search } from 'lucide-react';

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
  trainerId: string;
  maxCapacity: number;
  currentBookings: number;
  isActive: boolean;
}

interface TrainerOption {
  uid: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
}

const EMPTY_SLOT = {
  courseKey: 'programmafc',
  courseName: 'Programma FC',
  dayOfWeek: 1,
  startTime: '09:00',
  endTime: '10:00',
  room: 'Sala Alpha',
  trainerName: '',
  trainerId: '',
  maxCapacity: 20,
  currentBookings: 0,
  isActive: true,
};

const ROOMS = ['Sala Alpha', 'Power Room', 'Flow Room'];

export default function AdminCoursesPage({ navigate }: Props) {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [trainers, setTrainers] = useState<TrainerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSlot, setEditingSlot] = useState<Slot | null>(null);
  const [form, setForm] = useState({ ...EMPTY_SLOT });
  const [saving, setSaving] = useState(false);
  const [filterDay, setFilterDay] = useState<number | null>(null);
  const [trainerSearch, setTrainerSearch] = useState('');
  const [showTrainerDropdown, setShowTrainerDropdown] = useState(false);

  useEffect(() => { loadSlots(); loadTrainers(); }, []);

  async function loadSlots() {
    setLoading(true);
    const snap = await getDocs(collection(db, 'slots'));
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Slot));
    data.sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime));
    setSlots(data);
    setLoading(false);
  }

  async function loadTrainers() {
    // Carica utenti con ruolo trainer o admin
    const snap = await getDocs(collection(db, 'users'));
    const data = snap.docs
      .map(d => ({ uid: d.id, ...d.data() } as any))
      .filter((u: any) => u.role === 'trainer' || u.role === 'admin')
      .map((u: any) => ({
        uid: u.uid,
        displayName: u.displayName,
        email: u.email,
        avatarUrl: u.avatarUrl,
      } as TrainerOption));
    setTrainers(data);
  }

  function openNew() {
    setEditingSlot(null);
    setForm({ ...EMPTY_SLOT });
    setTrainerSearch('');
    setShowForm(true);
  }

  function openEdit(slot: Slot) {
    setEditingSlot(slot);
    setForm({
      courseKey: slot.courseKey,
      courseName: slot.courseName,
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
      room: slot.room,
      trainerName: slot.trainerName,
      trainerId: slot.trainerId ?? '',
      maxCapacity: slot.maxCapacity,
      currentBookings: slot.currentBookings,
      isActive: slot.isActive,
    });
    setTrainerSearch(slot.trainerName || '');
    setShowForm(true);
  }

  function handleCourseChange(key: string) {
    const info = COURSES_INFO[key];
    setForm(f => ({ ...f, courseKey: key, courseName: info?.label ?? key }));
  }

  function selectTrainer(trainer: TrainerOption) {
    setForm(f => ({ ...f, trainerName: trainer.displayName, trainerId: trainer.uid }));
    setTrainerSearch(trainer.displayName);
    setShowTrainerDropdown(false);
  }

  function clearTrainer() {
    setForm(f => ({ ...f, trainerName: '', trainerId: '' }));
    setTrainerSearch('');
  }

  const filteredTrainers = trainers.filter(t =>
    t.displayName.toLowerCase().includes(trainerSearch.toLowerCase()) ||
    t.email.toLowerCase().includes(trainerSearch.toLowerCase())
  );

  async function handleSave() {
    setSaving(true);
    try {
      const data = { ...form };
      if (editingSlot) {
        await updateDoc(doc(db, 'slots', editingSlot.id), data);
      } else {
        await addDoc(collection(db, 'slots'), {
          ...data,
          currentBookings: 0,
          createdAt: serverTimestamp(),
        });
      }
      await loadSlots();
      setShowForm(false);
    } catch (e) { console.error(e); }
    setSaving(false);
  }

  async function handleDelete(slot: Slot) {
    if (!confirm(`Eliminare ${slot.courseName} - ${DAYS_IT[slot.dayOfWeek]} ${slot.startTime}?`)) return;
    await deleteDoc(doc(db, 'slots', slot.id));
    setSlots(prev => prev.filter(s => s.id !== slot.id));
  }

  async function toggleActive(slot: Slot) {
    await updateDoc(doc(db, 'slots', slot.id), { isActive: !slot.isActive });
    setSlots(prev => prev.map(s => s.id === slot.id ? { ...s, isActive: !s.isActive } : s));
  }

  const filtered = filterDay !== null ? slots.filter(s => s.dayOfWeek === filterDay) : slots;

  return (
    <div className="min-h-screen bg-[#2C2C2C]">
      {/* Header */}
      <div className="bg-[#1a1a1a] px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate({ page: 'ADMIN' })} className="text-white/60 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-white font-bold text-lg">Gestione Corsi</h1>
        </div>
        <button onClick={openNew}
          className="bg-[#C0392B] text-white px-3 py-2 rounded-xl flex items-center gap-1 text-sm font-bold">
          <Plus className="w-4 h-4" /> Aggiungi
        </button>
      </div>

      {/* Filtro per giorno */}
      <div className="px-4 pt-4 flex gap-2 overflow-x-auto pb-2">
        <button onClick={() => setFilterDay(null)}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex-shrink-0 ${filterDay === null ? 'bg-[#C0392B] text-white' : 'bg-white/10 text-white/60'}`}>
          Tutti
        </button>
        {[1,2,3,4,5,6].map(d => (
          <button key={d} onClick={() => setFilterDay(d)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex-shrink-0 ${filterDay === d ? 'bg-[#C0392B] text-white' : 'bg-white/10 text-white/60'}`}>
            {DAYS_IT[d]}
          </button>
        ))}
      </div>

      {/* Lista slot */}
      <div className="px-4 py-3 space-y-2">
        {loading ? (
          <div className="flex justify-center mt-12">
            <div className="w-8 h-8 border-2 border-[#C0392B] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center mt-12 text-white/30 text-sm">Nessun corso. Aggiungine uno!</div>
        ) : (
          filtered.map(slot => {
            const info = COURSES_INFO[slot.courseKey] ?? { emoji: '🏋️' };
            return (
              <div key={slot.id} className={`bg-white/5 border rounded-xl p-3 flex items-center gap-3 ${slot.isActive ? 'border-white/10' : 'border-white/5 opacity-50'}`}>
                <span className="text-xl">{info.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-sm truncate">{slot.courseName}</p>
                  <p className="text-white/40 text-xs">
                    {DAYS_IT[slot.dayOfWeek]} · {slot.startTime}–{slot.endTime} · {slot.room}
                  </p>
                  <p className="text-white/30 text-xs">
                    {slot.trainerName || 'Nessun istruttore'} · max {slot.maxCapacity} posti
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => toggleActive(slot)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${slot.isActive ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/30'}`}>
                    {slot.isActive ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                  </button>
                  <button onClick={() => openEdit(slot)}
                    className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-white/60 hover:text-white">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(slot)}
                    className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-500/20">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Form modale */}
      {showForm && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end">
          <div className="bg-[#1e1e1e] w-full rounded-t-2xl p-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-bold text-lg">
                {editingSlot ? 'Modifica corso' : 'Nuovo corso'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-white/40 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Corso */}
              <div>
                <label className="text-white/50 text-xs mb-1 block">Corso</label>
                <select value={form.courseKey} onChange={e => handleCourseChange(e.target.value)}
                  className="w-full bg-white/10 text-white border border-white/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#C0392B]">
                  {Object.entries(COURSES_INFO).map(([key, info]) => (
                    <option key={key} value={key} className="bg-[#2C2C2C]">{info.label}</option>
                  ))}
                </select>
              </div>

              {/* Giorno */}
              <div>
                <label className="text-white/50 text-xs mb-1 block">Giorno</label>
                <select value={form.dayOfWeek} onChange={e => setForm(f => ({ ...f, dayOfWeek: Number(e.target.value) }))}
                  className="w-full bg-white/10 text-white border border-white/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#C0392B]">
                  {[1,2,3,4,5,6].map(d => (
                    <option key={d} value={d} className="bg-[#2C2C2C]">{DAYS_IT[d]}</option>
                  ))}
                </select>
              </div>

              {/* Orari */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-white/50 text-xs mb-1 block">Inizio</label>
                  <input type="time" value={form.startTime}
                    onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                    className="w-full bg-white/10 text-white border border-white/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#C0392B]" />
                </div>
                <div>
                  <label className="text-white/50 text-xs mb-1 block">Fine</label>
                  <input type="time" value={form.endTime}
                    onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                    className="w-full bg-white/10 text-white border border-white/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#C0392B]" />
                </div>
              </div>

              {/* Sala */}
              <div>
                <label className="text-white/50 text-xs mb-1 block">Sala</label>
                <select value={form.room} onChange={e => setForm(f => ({ ...f, room: e.target.value }))}
                  className="w-full bg-white/10 text-white border border-white/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#C0392B]">
                  {ROOMS.map(r => (
                    <option key={r} value={r} className="bg-[#2C2C2C]">{r}</option>
                  ))}
                </select>
              </div>

              {/* Istruttore — dropdown con ricerca */}
              <div>
                <label className="text-white/50 text-xs mb-1 block">Istruttore</label>
                <div className="relative">
                  <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-xl px-4 py-3 focus-within:border-[#C0392B]">
                    <Search className="w-4 h-4 text-white/30 flex-shrink-0" />
                    <input
                      type="text"
                      placeholder="Cerca istruttore per nome o email..."
                      value={trainerSearch}
                      onChange={e => { setTrainerSearch(e.target.value); setShowTrainerDropdown(true); }}
                      onFocus={() => setShowTrainerDropdown(true)}
                      className="flex-1 bg-transparent text-white placeholder-white/30 text-sm focus:outline-none"
                    />
                    {form.trainerName && (
                      <button onClick={clearTrainer} className="text-white/30 hover:text-white">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Dropdown risultati */}
                  {showTrainerDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-[#2C2C2C] border border-white/20 rounded-xl overflow-hidden z-10 max-h-48 overflow-y-auto">
                      {trainers.length === 0 ? (
                        <div className="px-4 py-3 text-white/30 text-sm">
                          Nessun trainer disponibile. Assegna il ruolo "Trainer" a un socio dalla Gestione Soci.
                        </div>
                      ) : filteredTrainers.length === 0 ? (
                        <div className="px-4 py-3 text-white/30 text-sm">Nessun risultato</div>
                      ) : (
                        <>
                          <button
                            onClick={() => { clearTrainer(); setShowTrainerDropdown(false); }}
                            className="w-full px-4 py-2.5 text-left text-white/40 text-sm hover:bg-white/5 border-b border-white/5">
                            — Nessun istruttore
                          </button>
                          {filteredTrainers.map(t => (
                            <button key={t.uid} onClick={() => selectTrainer(t)}
                              className={`w-full px-4 py-2.5 text-left hover:bg-white/5 flex items-center gap-3 ${form.trainerId === t.uid ? 'bg-[#C0392B]/10' : ''}`}>
                              <div className="w-8 h-8 rounded-full bg-[#4A4A4A] flex-shrink-0 flex items-center justify-center overflow-hidden">
                                {t.avatarUrl
                                  ? <img src={t.avatarUrl} className="w-full h-full object-cover" />
                                  : <span className="text-white text-xs font-bold">{t.displayName.charAt(0)}</span>
                                }
                              </div>
                              <div className="min-w-0">
                                <p className="text-white text-sm font-medium truncate">{t.displayName}</p>
                                <p className="text-white/30 text-xs truncate">{t.email}</p>
                              </div>
                              {form.trainerId === t.uid && <Check className="w-4 h-4 text-[#C0392B] ml-auto flex-shrink-0" />}
                            </button>
                          ))}
                        </>
                      )}
                    </div>
                  )}
                </div>
                {form.trainerName && (
                  <p className="text-white/40 text-xs mt-1">✅ Selezionato: {form.trainerName}</p>
                )}
              </div>

              {/* Posti */}
              <div>
                <label className="text-white/50 text-xs mb-1 block">Posti massimi</label>
                <input type="number" min="1" max="100" value={form.maxCapacity}
                  onChange={e => setForm(f => ({ ...f, maxCapacity: Number(e.target.value) }))}
                  className="w-full bg-white/10 text-white border border-white/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#C0392B]" />
              </div>

              {/* Attivo */}
              <div className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3">
                <span className="text-white text-sm">Corso attivo</span>
                <button onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                  className={`w-12 h-6 rounded-full transition-colors ${form.isActive ? 'bg-[#C0392B]' : 'bg-white/20'}`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${form.isActive ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>

              <button onClick={handleSave} disabled={saving}
                className="w-full bg-[#C0392B] hover:bg-[#96281B] text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50">
                {saving ? 'Salvataggio...' : editingSlot ? 'Salva modifiche' : 'Aggiungi corso'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}