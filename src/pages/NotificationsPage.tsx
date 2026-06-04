// ============================================================
// GHIMNA TROTTA 2.0 — pages/NotificationsPage.tsx
// ============================================================
import React, { useEffect, useState } from 'react';
import {
  collection, query, where, getDocs,
  updateDoc, doc, orderBy, deleteDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { RouteState } from '../types';
import { ArrowLeft, Bell, Check, Trash2 } from 'lucide-react';

interface Props { navigate: (r: RouteState) => void; }

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  slotId?: string;
  date?: string;
}

const TYPE_EMOJI: Record<string, string> = {
  waitlist_available: '🎉',
  booking_confirm:    '✅',
  booking_cancel:     '❌',
  membership_expiry:  '⏰',
  new_course:         '🆕',
  general:            '📢',
};

export default function NotificationsPage({ navigate }: Props) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (user) loadNotifications(); }, [user]);

  async function loadNotifications() {
    if (!user) return;
    setLoading(true);
    try {
      const snap = await getDocs(query(
        collection(db, 'notifications'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      ));
      setNotifications(snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate?.() ?? new Date(),
      } as Notification)));
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function markAsRead(id: string) {
    await updateDoc(doc(db, 'notifications', id), { read: true });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }

  async function markAllRead() {
    const unread = notifications.filter(n => !n.read);
    await Promise.all(unread.map(n => updateDoc(doc(db, 'notifications', n.id), { read: true })));
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }

  async function deleteNotification(id: string) {
    await deleteDoc(doc(db, 'notifications', id));
    setNotifications(prev => prev.filter(n => n.id !== id));
  }

  function formatTime(date: Date) {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return 'Adesso';
    if (mins < 60) return `${mins} min fa`;
    if (hours < 24) return `${hours} ore fa`;
    if (days === 1) return 'Ieri';
    return date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-[#2C2C2C]">
      <div className="bg-[#1a1a1a] px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate({ page: 'DASHBOARD' })} className="text-white/60 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-white font-bold text-lg">Notifiche</h1>
          {unreadCount > 0 && (
            <span className="bg-[#C0392B] text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="text-white/40 hover:text-white text-xs flex items-center gap-1">
            <Check className="w-3 h-3" /> Tutte lette
          </button>
        )}
      </div>

      <div className="p-4 space-y-2">
        {loading ? (
          <div className="flex justify-center mt-12">
            <div className="w-8 h-8 border-2 border-[#C0392B] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-24 gap-3 text-white/30">
            <Bell className="w-12 h-12" />
            <p className="text-sm">Nessuna notifica</p>
            <p className="text-xs text-center max-w-xs">
              Riceverai notifiche quando si libera un posto in lista d'attesa o quando il tuo abbonamento sta per scadere.
            </p>
          </div>
        ) : (
          notifications.map(notif => (
            <div
              key={notif.id}
              onClick={() => !notif.read && markAsRead(notif.id)}
              className={`rounded-2xl p-4 border transition-all cursor-pointer ${
                notif.read
                  ? 'bg-white/3 border-white/5 opacity-60'
                  : 'bg-white/5 border-white/10'
              }`}>
              <div className="flex items-start gap-3">
                <span className="text-2xl flex-shrink-0">
                  {TYPE_EMOJI[notif.type] ?? '📢'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`font-bold text-sm ${notif.read ? 'text-white/60' : 'text-white'}`}>
                      {notif.title}
                    </p>
                    {!notif.read && (
                      <div className="w-2 h-2 bg-[#C0392B] rounded-full flex-shrink-0 mt-1" />
                    )}
                  </div>
                  <p className="text-white/50 text-xs mt-0.5">{notif.message}</p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-white/30 text-xs">{formatTime(notif.createdAt)}</p>
                    <button
                      onClick={e => { e.stopPropagation(); deleteNotification(notif.id); }}
                      className="text-white/20 hover:text-red-400 transition-colors">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Se è una notifica lista d'attesa, mostra bottone per prenotare */}
                  {notif.type === 'waitlist_available' && (
                    <button
                      onClick={e => { e.stopPropagation(); navigate({ page: 'COURSES' }); }}
                      className="mt-2 bg-[#C0392B] text-white text-xs font-bold px-4 py-1.5 rounded-lg">
                      Vai ai corsi →
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}