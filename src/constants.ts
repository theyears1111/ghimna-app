// ============================================================
// GHIMNA TROTTA 2.0 — constants.ts
// ============================================================

export const BRAND = {
  name: 'Ghimna Trotta 2.0',
  shortName: 'Ghimna Trotta',
  tagline: 'Il tuo corpo. La nostra missione.',
  address: 'Via Nazionale, 20',
  city: '84025 Eboli (SA)',
  phone1: '0828 332639',
  phone2: '329 154 0113',
  phoneInfo: '331 286 2433',
  email: 'info@ghimnatrotta.it',
  instagram: 'https://www.instagram.com/ghimnatrotta/',
  facebook: 'https://www.facebook.com/palestratrotta/',
  skipresUrl: 'https://skipres.com/fuscocristina_001',
  foundedYear: 2011,
} as const;

export const COLORS = {
  primary: '#C0392B',
  primaryDark: '#96281B',
  primaryLight: '#E74C3C',
  dark: '#2C2C2C',
  darkGray: '#4A4A4A',
  mediumGray: '#9E9E9E',
  lightGray: '#F5F5F5',
  white: '#FFFFFF',
} as const;

export const GYM_HOURS = {
  weekdays: '07:00 – 22:15',
  saturday: '07:00 – 19:30',
  sunday: 'Chiuso',
} as const;

export const COURSES_INFO: Record<string, {
  label: string;
  emoji: string;
  color: string;
  image: string;
  description: string;
}> = {
  programmafc: {
    label: 'Programma FC',
    emoji: '🏆',
    color: '#C0392B',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80',
    description: 'Un corso pensato per chi vuole allenare il corpo in modo completo ed equilibrato, ogni giorno è dedicato a gruppi muscolari specifici.',
  },
  pilates: {
    label: 'Pilates',
    emoji: '🧘',
    color: '#5D6D7E',
    image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80',
    description: 'Allenamento a basso impatto che rafforza il core, migliora la postura e aumenta la flessibilità con movimenti controllati e precisi.',
  },
  yoga: {
    label: 'Hatha Yoga',
    emoji: '☯️',
    color: '#7D6608',
    image: 'https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?w=800&q=80',
    description: 'La disciplina dello yoga che unisce corpo e mente attraverso posture, respirazione e meditazione per ritrovare equilibrio e leggerezza.',
  },
  functional: {
    label: 'Functional Training',
    emoji: '💪',
    color: '#1A5276',
    image: 'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=800&q=80',
    description: 'Allenamento mirato al miglioramento delle funzioni motorie quotidiane con esercizi dinamici che coinvolgono tutto il corpo.',
  },
  bodyflying: {
    label: 'Body Flying',
    emoji: '🪂',
    color: '#1E8449',
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80',
    description: 'Allenamento sospeso con tessuti aerei che combina forza, flessibilità e coordinazione in un\'esperienza unica e divertente.',
  },
  pump: {
    label: 'Pump',
    emoji: '🏋️',
    color: '#6C3483',
    image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&q=80',
    description: 'Workout con bilanciere ad alta intensità ispirato al body building, combinando serie di ripetizioni e ritmo musicale coinvolgente.',
  },
  boxe: {
    label: 'Boxe Training',
    emoji: '🥊',
    color: '#784212',
    image: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=800&q=80',
    description: 'Allenamento ispirato alla boxe che migliora resistenza, coordinazione e forza attraverso combinazioni di pugni, difesa e footwork.',
  },
  ritmica: {
    label: 'Ginnastica Ritmica',
    emoji: '🎀',
    color: '#B7950B',
    image: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800&q=80',
    description: 'Disciplina che combina ginnastica, danza e uso di attrezzi come nastri e cerchi, sviluppando grazia, coordinazione e flessibilità.',
  },
  walking: {
    label: 'Walking',
    emoji: '🚶',
    color: '#1A7A4A',
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80',
    description: 'Camminata energica a ritmo sostenuto, ideale per migliorare la resistenza cardiovascolare e bruciare calorie in modo dolce.',
  },
  mobility: {
    label: 'Mobility + Addome',
    emoji: '🤸',
    color: '#2E86AB',
    image: 'https://images.unsplash.com/photo-1552196563-55cd4e45efb3?w=800&q=80',
    description: 'Sessione dedicata alla mobilità articolare e al rafforzamento del core addominale per una postura migliore e meno dolori.',
  },
  aereo: {
    label: 'Aereo Workout',
    emoji: '✈️',
    color: '#6A0572',
    image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80',
    description: 'Allenamento aerobico sospeso che combina forza e cardio in modo innovativo e divertente.',
  },
  postural: {
    label: 'Postural Pilates',
    emoji: '🧍',
    color: '#4A5568',
    image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80',
    description: 'Variante del Pilates focalizzata sulla correzione posturale, ideale per chi soffre di mal di schiena e tensioni muscolari.',
  },
  autodifesa: {
    label: 'Autodifesa',
    emoji: '🥋',
    color: '#2D3748',
    image: 'https://images.unsplash.com/photo-1555597673-b21d5c935865?w=800&q=80',
    description: 'Corso pratico di tecniche di autodifesa personale, adatto a tutti i livelli. Migliora sicurezza, riflessi e condizione fisica.',
  },
};

export const DAYS_IT = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];

export const MEMBERSHIP_LABELS: Record<string, string> = {
  active:    '✅ Attivo',
  expired:   '❌ Scaduto',
  suspended: '⏸️ Sospeso',
  trial:     '🆕 Prova',
};