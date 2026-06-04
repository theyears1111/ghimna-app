// ============================================================
// GHIMNA TROTTA 2.0 — pages/AdminPage.tsx
// ============================================================
import React from 'react';
import { RouteState } from '../types';
import { ArrowLeft, Users, BookOpen, CalendarDays, Megaphone } from 'lucide-react';

interface Props { navigate: (r: RouteState) => void; }

export default function AdminPage({ navigate }: Props) {
  return (
    <div className="min-h-screen bg-[#2C2C2C]">
      <div className="bg-[#1a1a1a] px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate({ page: 'DASHBOARD' })} className="text-white/60 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-white font-bold text-lg">🛡️ Admin</h1>
      </div>
      <div className="p-4 space-y-3">

        <button onClick={() => navigate({ page: 'ADMIN_PRESENZE' })}
          className="w-full bg-[#C0392B]/10 border border-[#C0392B]/30 rounded-2xl p-4 flex items-center gap-4 hover:bg-[#C0392B]/20 transition-colors text-left">
          <CalendarDays className="w-6 h-6 text-[#C0392B]" />
          <div>
            <p className="text-white font-bold">Presenze del giorno</p>
            <p className="text-white/40 text-xs">Chi è iscritto a ogni corso</p>
          </div>
        </button>
        <button onClick={() => navigate({ page: 'ADMIN_AVVISI' })}
  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4 hover:bg-white/10 transition-colors text-left">
  <Megaphone className="w-6 h-6 text-[#C0392B]" />
  <div>
    <p className="text-white font-bold">Bacheca Avvisi</p>
    <p className="text-white/40 text-xs">Comunica con i soci</p>
  </div>
</button>

        <button onClick={() => navigate({ page: 'ADMIN_MEMBERS' })}
          className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4 hover:bg-white/10 transition-colors text-left">
          <Users className="w-6 h-6 text-[#C0392B]" />
          <div>
            <p className="text-white font-bold">Gestione Soci</p>
            <p className="text-white/40 text-xs">Visualizza e gestisci gli iscritti</p>
          </div>
        </button>

        <button onClick={() => navigate({ page: 'ADMIN_COURSES' })}
          className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4 hover:bg-white/10 transition-colors text-left">
          <BookOpen className="w-6 h-6 text-[#C0392B]" />
          <div>
            <p className="text-white font-bold">Gestione Corsi</p>
            <p className="text-white/40 text-xs">Crea e modifica i corsi</p>
          </div>
        </button>

      </div>
    </div>
  );
}