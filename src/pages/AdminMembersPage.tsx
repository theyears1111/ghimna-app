// ============================================================
// GHIMNA TROTTA 2.0 — pages/AdminMembersPage.tsx
// ============================================================
import React, { useEffect, useState } from 'react';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { RouteState, GhimnaUser, MembershipStatus, UserRole } from '../types';
import { ArrowLeft, Search, ChevronDown, Phone, Mail, Calendar, Edit2, Check, X } from 'lucide-react';
import { MEMBERSHIP_LABELS, COURSES_INFO } from '../constants';

interface Props { navigate: (r: RouteState) => void; }

const STATUS_COLORS: Record<string, string> = {
  active:    'bg-green-500/20 text-green-400 border-green-500/30',
  trial:     'bg-blue-500/20 text-blue-400 border-blue-500/30',
  expired:   'bg-red-500/20 text-red-400 border-red-500/30',
  suspended: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
};

export default function AdminMembersPage({ navigate }: Props) {
  const [members, setMembers] = useState<GhimnaUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [editingPhone, setEditingPhone] = useState<string | null>(null);
  const [phoneValue, setPhoneValue] = useState('');
  const [editingBio, setEditingBio] = useState<string | null>(null);
  const [bioValue, setBioValue] = useState('');

  useEffect(() => { loadMembers(); }, []);

  async function loadMembers() {
    setLoading(true);
    const snap = await getDocs(collection(db, 'users'));
    const data = snap.docs.map(d => {
      const raw = d.data();
      return {
        ...raw,
        uid: d.id,
        membershipExpiry: raw.membershipExpiry?.toDate?.() ?? null,
        createdAt: raw.createdAt?.toDate?.() ?? new Date(),
      } as GhimnaUser;
    });
    data.sort((a, b) => a.displayName.localeCompare(b.displayName));
    setMembers(data);
    setLoading(false);
  }

  async function updateMember(uid: string, field: string, value: any) {
    setSaving(uid);
    await updateDoc(doc(db, 'users', uid), { [field]: value });
    setMembers(prev => prev.map(m => m.uid === uid ? { ...m, [field]: value } : m));
    setSaving(null);
  }

  async function updateExpiry(uid: string, dateStr: string) {
    const date = dateStr ? new Date(dateStr) : null;
    setSaving(uid);
    await updateDoc(doc(db, 'users', uid), { membershipExpiry: date });
    setMembers(prev => prev.map(m => m.uid === uid ? { ...m, membershipExpiry: date } : m));
    setSaving(null);
  }

  async function savePhone(uid: string) {
    const cleaned = phoneValue.replace(/[^0-9]/g, '').slice(0, 10);
    await updateMember(uid, 'phone', cleaned);
    setEditingPhone(null);
  }

  async function saveBio(uid: string) {
    await updateMember(uid, 'bio', bioValue.trim());
    setEditingBio(null);
  }

  async function toggleSpecialty(uid: string, key: string, currentSpecialties: string[]) {
    const updated = currentSpecialties.includes(key)
      ? currentSpecialties.filter(s => s !== key)
      : [...currentSpecialties, key];
    await updateMember(uid, 'specialties', updated);
  }

  const filtered = members.filter(m =>
    m.displayName.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase()) ||
    (m.phone ?? '').includes(search)
  );

  return (
    <div className="min-h-screen bg-[#2C2C2C]">
      {/* Header */}
      <div className="bg-[#1a1a1a] px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate({ page: 'ADMIN' })} className="text-white/60 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-white font-bold text-lg">Gestione Soci</h1>
        <span className="ml-auto bg-white/10 text-white/50 text-xs px-2 py-1 rounded-lg">
          {members.length} soci
        </span>
      </div>

      {/* Ricerca */}
      <div className="px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input type="text" placeholder="Cerca per nome, email o telefono..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 text-white placeholder-white/30 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#C0392B]"
          />
        </div>
      </div>

      {/* Stats rapide */}
      <div className="px-4 pb-3 grid grid-cols-4 gap-2">
        {(['active', 'trial', 'expired', 'suspended'] as MembershipStatus[]).map(s => {
          const count = members.filter(m => m.membershipStatus === s).length;
          return (
            <div key={s} className={`rounded-xl border p-2 text-center ${STATUS_COLORS[s]}`}>
              <p className="text-lg font-black">{count}</p>
              <p className="text-xs opacity-70">{s === 'active' ? 'Attivi' : s === 'trial' ? 'Prova' : s === 'expired' ? 'Scaduti' : 'Sosp.'}</p>
            </div>
          );
        })}
      </div>

      {/* Lista soci */}
      <div className="px-4 space-y-2 pb-6">
        {loading ? (
          <div className="flex justify-center mt-12">
            <div className="w-8 h-8 border-2 border-[#C0392B] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-white/30 text-sm mt-12">Nessun socio trovato</p>
        ) : (
          filtered.map(member => {
            const isExpanded = expandedId === member.uid;
            const isSaving = saving === member.uid;
            const isTrainer = member.role === 'trainer' || member.role === 'admin';
            return (
              <div key={member.uid} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <button onClick={() => setExpandedId(isExpanded ? null : member.uid)}
                  className="w-full p-4 flex items-center gap-3 text-left">
                  <div className="w-10 h-10 rounded-full bg-[#4A4A4A] flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {member.avatarUrl
                      ? <img src={member.avatarUrl} className="w-full h-full object-cover" />
                      : <span className="text-white font-bold text-sm">{member.displayName.charAt(0).toUpperCase()}</span>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-white font-bold text-sm truncate">{member.displayName}</p>
                      {isTrainer && <span className="text-xs bg-[#C0392B]/20 text-[#C0392B] px-1.5 py-0.5 rounded flex-shrink-0">💪 Trainer</span>}
                    </div>
                    <p className="text-white/40 text-xs truncate">{member.email}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs px-2 py-1 rounded-lg border ${STATUS_COLORS[member.membershipStatus]}`}>
                      {member.membershipStatus === 'active' ? 'Attivo' :
                       member.membershipStatus === 'trial' ? 'Prova' :
                       member.membershipStatus === 'expired' ? 'Scaduto' : 'Sosp.'}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-white/30 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-white/10 p-4 space-y-4">
                    {/* Contatti */}
                    <div className="space-y-2">
                      {editingPhone === member.uid ? (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-white/30 flex-shrink-0" />
                          <input type="tel" inputMode="numeric" value={phoneValue}
                            onChange={e => setPhoneValue(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
                            className="flex-1 bg-white/10 text-white border border-white/20 rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-[#C0392B]" autoFocus />
                          <button onClick={() => savePhone(member.uid)} className="w-6 h-6 bg-green-500/20 rounded flex items-center justify-center text-green-400"><Check className="w-3 h-3" /></button>
                          <button onClick={() => setEditingPhone(null)} className="w-6 h-6 bg-white/10 rounded flex items-center justify-center text-white/40"><X className="w-3 h-3" /></button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <a href={`tel:${member.phone}`} className="flex items-center gap-2 text-white/50 text-sm hover:text-white flex-1">
                            <Phone className="w-4 h-4" />
                            {member.phone || <span className="text-white/20">Nessun numero</span>}
                          </a>
                          <button onClick={() => { setEditingPhone(member.uid); setPhoneValue(member.phone ?? ''); }} className="text-white/20 hover:text-white/50">
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                      <a href={`mailto:${member.email}`} className="flex items-center gap-2 text-white/50 text-sm hover:text-white">
                        <Mail className="w-4 h-4" /> {member.email}
                      </a>
                      <p className="flex items-center gap-2 text-white/30 text-xs">
                        <Calendar className="w-3 h-3" /> Iscritto il {member.createdAt.toLocaleDateString('it-IT')}
                      </p>
                    </div>

                    {/* Bio e specialità — solo per trainer/admin */}
                    {isTrainer && (
                      <div className="space-y-3 bg-[#C0392B]/5 border border-[#C0392B]/10 rounded-xl p-3">
                        <p className="text-[#C0392B] text-xs font-bold uppercase tracking-widest">Profilo Trainer</p>

                        {/* Bio */}
                        <div>
                          <p className="text-white/50 text-xs mb-1">Bio</p>
                          {editingBio === member.uid ? (
                            <div className="space-y-2">
                              <textarea value={bioValue} onChange={e => setBioValue(e.target.value)}
                                rows={3} placeholder="Descrizione dell'istruttore..."
                                className="w-full bg-white/10 text-white placeholder-white/30 border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#C0392B] resize-none" autoFocus />
                              <div className="flex gap-2">
                                <button onClick={() => saveBio(member.uid)} className="flex-1 bg-green-500/20 text-green-400 text-xs font-bold py-1.5 rounded-lg flex items-center justify-center gap-1"><Check className="w-3 h-3" /> Salva</button>
                                <button onClick={() => setEditingBio(null)} className="flex-1 bg-white/10 text-white/40 text-xs font-bold py-1.5 rounded-lg">Annulla</button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start gap-2">
                              <p className="text-white/60 text-sm flex-1">{member.bio || <span className="text-white/20 italic">Nessuna bio inserita</span>}</p>
                              <button onClick={() => { setEditingBio(member.uid); setBioValue(member.bio ?? ''); }} className="text-white/20 hover:text-white/50 flex-shrink-0">
                                <Edit2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Specialità */}
                        <div>
                          <p className="text-white/50 text-xs mb-2">Specialità</p>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(COURSES_INFO).map(([key, info]) => {
                              const selected = (member.specialties ?? []).includes(key);
                              return (
                                <button key={key}
                                  onClick={() => toggleSpecialty(member.uid, key, member.specialties ?? [])}
                                  className={`px-2 py-1 rounded-lg text-xs font-bold border transition-all ${
                                    selected ? 'bg-[#C0392B]/20 border-[#C0392B]/40 text-[#C0392B]' : 'bg-white/5 border-white/10 text-white/30'
                                  }`}>
                                  {info.emoji} {info.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Stato abbonamento */}
                    <div>
                      <p className="text-white/50 text-xs mb-2 uppercase tracking-widest">Stato abbonamento</p>
                      <div className="grid grid-cols-2 gap-2">
                        {(['active', 'trial', 'expired', 'suspended'] as MembershipStatus[]).map(s => (
                          <button key={s} onClick={() => updateMember(member.uid, 'membershipStatus', s)} disabled={isSaving}
                            className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${member.membershipStatus === s ? STATUS_COLORS[s] : 'bg-white/5 border-white/10 text-white/30 hover:bg-white/10'}`}>
                            {s === 'active' ? '✅ Attivo' : s === 'trial' ? '🆕 Prova' : s === 'expired' ? '❌ Scaduto' : '⏸️ Sospeso'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Data scadenza */}
                    <div>
                      <p className="text-white/50 text-xs mb-2 uppercase tracking-widest">Scadenza abbonamento</p>
                      <input type="date"
                        defaultValue={member.membershipExpiry ? member.membershipExpiry.toISOString().split('T')[0] : ''}
                        onChange={e => updateExpiry(member.uid, e.target.value)}
                        className="w-full bg-white/10 text-white border border-white/20 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#C0392B]" />
                    </div>

                    {/* Ruolo */}
                    <div>
                      <p className="text-white/50 text-xs mb-2 uppercase tracking-widest">Ruolo</p>
                      <div className="flex gap-2">
                        {(['member', 'trainer', 'admin'] as UserRole[]).map(r => (
                          <button key={r} onClick={() => updateMember(member.uid, 'role', r)} disabled={isSaving}
                            className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${member.role === r ? 'bg-[#C0392B]/20 border-[#C0392B]/40 text-[#C0392B]' : 'bg-white/5 border-white/10 text-white/30 hover:bg-white/10'}`}>
                            {r === 'member' ? '👤 Socio' : r === 'trainer' ? '💪 Trainer' : '🛡️ Admin'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {isSaving && <p className="text-center text-white/40 text-xs">Salvataggio...</p>}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}