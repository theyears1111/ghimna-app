// ============================================================
// GHIMNA TROTTA 2.0 — pages/ProfilePage.tsx
// Con storico corsi passati
// ============================================================
import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { RouteState } from '../types';
import { ArrowLeft, LogOut, Edit2, Check, X, Clock } from 'lucide-react';
import { MEMBERSHIP_LABELS, COURSES_INFO } from '../constants';

interface Props { navigate: (r: RouteState) => void; }

interface PastBooking {
  id: string;
  courseName: string;
  courseKey: string;
  date: string;
  startTime: string;
}

const MONTHS_FULL = ['gennaio','febbraio','marzo','aprile','maggio','giugno',
  'luglio','agosto','settembre','ottobre','novembre','dicembre'];

function formatDateFull(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getDate()} ${MONTHS_FULL[d.getMonth()]} ${d.getFullYear()}`;
}

export default function ProfilePage({ navigate }: Props) {
  const { user, logout, updateProfile } = useAuth();
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(user?.displayName ?? '');
  const [saving, setSaving] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);
  const [newPhone, setNewPhone] = useState(user?.phone ?? '');
  const [savingPhone, setSavingPhone] = useState(false);
  const [pastBookings, setPastBookings] = useState<PastBooking[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [showAllHistory, setShowAllHistory] = useState(false);

  useEffect(() => { if (user) loadHistory(); }, [user]);

  async function loadHistory() {
    if (!user) return;
    setLoadingHistory(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const snap = await getDocs(query(
        collection(db, 'bookings'),
        where('userId', '==', user.uid),
        where('status', '==', 'confirmed'),
        where('date', '<', today),
      ));
      const data = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as PastBooking))
        .sort((a, b) => b.date.localeCompare(a.date));
      setPastBookings(data);
    } catch (e) { console.error(e); }
    setLoadingHistory(false);
  }

  async function handleSaveName() {
    if (!newName.trim()) return;
    setSaving(true);
    await updateProfile({ displayName: newName.trim() });
    setSaving(false);
    setEditingName(false);
  }

  async function handleSavePhone() {
    const cleaned = newPhone.replace(/[^0-9]/g, '');
    if (cleaned.length < 9 || cleaned.length > 10) {
      return; // validazione silenziosa, il bottone è già disabilitato
    }
    setSavingPhone(true);
    await updateProfile({ phone: cleaned });
    setSavingPhone(false);
    setEditingPhone(false);
  }

  if (!user) return null;

  const visibleHistory = showAllHistory ? pastBookings : pastBookings.slice(0, 5);

  return (
    <div className="min-h-screen bg-[#2C2C2C]">
      <div className="bg-[#1a1a1a] px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate({ page: 'DASHBOARD' })} className="text-white/60 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-white font-bold text-lg">Profilo</h1>
      </div>

      <div className="p-4 space-y-4 pb-8">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center gap-4">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} className="w-16 h-16 rounded-full object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-[#4A4A4A] flex items-center justify-center overflow-hidden">
              <svg viewBox="0 0 100 100" className="w-10 h-10">
                <text x="20" y="62" fontFamily="Arial Black, sans-serif" fontSize="52" fontWeight="900" fill="white">G</text>
                <text x="52" y="72" fontFamily="Arial Black, sans-serif" fontSize="36" fontWeight="900" fill="#C0392B">T</text>
              </svg>
            </div>
          )}
          <div className="flex-1 min-w-0">
            {editingName ? (
              <div className="flex items-center gap-2">
                <input value={newName} onChange={e => setNewName(e.target.value)}
                  className="flex-1 bg-white/10 text-white border border-white/20 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#C0392B]" autoFocus />
                <button onClick={handleSaveName} disabled={saving}
                  className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center text-green-400">
                  <Check className="w-4 h-4" />
                </button>
                <button onClick={() => { setEditingName(false); setNewName(user.displayName); }}
                  className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-white/40">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-white font-bold text-lg truncate">{user.displayName}</p>
                <button onClick={() => setEditingName(true)} className="text-white/30 hover:text-white/60">
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            )}
            <p className="text-white/40 text-sm truncate">{user.email}</p>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <p className="text-white/50 text-xs uppercase tracking-widest mb-2">Abbonamento</p>
          <p className="text-white font-bold text-lg">{MEMBERSHIP_LABELS[user.membershipStatus]}</p>
          {user.membershipExpiry && (
            <p className="text-white/40 text-sm mt-1">Scade il {user.membershipExpiry.toLocaleDateString('it-IT')}</p>
          )}
          {user.membershipStatus === 'expired' && (
            <p className="text-red-400 text-sm mt-2">⚠️ Contatta la palestra per rinnovare.</p>
          )}
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <p className="text-white/50 text-xs uppercase tracking-widest mb-2">Telefono</p>
          {editingPhone ? (
            <div className="flex items-center gap-2">
              <input type="tel" inputMode="numeric" value={newPhone}
                onChange={e => setNewPhone(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
                maxLength={10}
                placeholder="Es. 3331234567"
                className="flex-1 bg-white/10 text-white placeholder-white/30 border border-white/20 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#C0392B]" autoFocus />
              <button onClick={handleSavePhone} disabled={savingPhone}
                className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center text-green-400">
                <Check className="w-4 h-4" />
              </button>
              <button onClick={() => setEditingPhone(false)}
                className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-white/40">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-white text-sm">{user.phone || 'Nessun numero inserito'}</span>
              <button onClick={() => setEditingPhone(true)} className="text-white/30 hover:text-white/60">
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
          <p className="text-white/50 text-xs uppercase tracking-widest mb-2">Account</p>
          <div className="flex justify-between items-center">
            <span className="text-white/50 text-sm">Ruolo</span>
            <span className="text-white text-sm font-medium capitalize">{user.role}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white/50 text-sm">Iscritto dal</span>
            <span className="text-white text-sm font-medium">{user.createdAt.toLocaleDateString('it-IT')}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white/50 text-sm">Corsi frequentati</span>
            <span className="text-[#C0392B] text-sm font-black">{pastBookings.length}</span>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-white/50 text-xs uppercase tracking-widest">Storico corsi</p>
            <span className="text-white/30 text-xs">{pastBookings.length} totali</span>
          </div>
          {loadingHistory ? (
            <div className="flex justify-center py-4">
              <div className="w-5 h-5 border-2 border-[#C0392B] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : pastBookings.length === 0 ? (
            <div className="text-center py-4">
              <Clock className="w-8 h-8 text-white/20 mx-auto mb-2" />
              <p className="text-white/30 text-sm">Nessun corso frequentato ancora</p>
            </div>
          ) : (
            <div className="space-y-2">
              {visibleHistory.map(booking => {
                const info = COURSES_INFO[booking.courseKey] ?? { emoji: '🏋️' };
                return (
                  <div key={booking.id} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                    <span className="text-lg">{info.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{booking.courseName}</p>
                      <p className="text-white/30 text-xs">{formatDateFull(booking.date)} · {booking.startTime}</p>
                    </div>
                  </div>
                );
              })}
              {pastBookings.length > 5 && (
                <button onClick={() => setShowAllHistory(!showAllHistory)}
                  className="w-full text-center text-[#C0392B] text-xs font-semibold py-2 hover:opacity-80">
                  {showAllHistory ? 'Mostra meno ↑' : `Mostra tutti (${pastBookings.length}) ↓`}
                </button>
              )}
            </div>
          )}
        </div>

        <button onClick={logout}
          className="w-full bg-red-600/10 border border-red-600/20 text-red-400 font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-red-600/20 transition-colors">
          <LogOut className="w-4 h-4" /> Esci dall'account
        </button>
      </div>
    </div>
  );
}