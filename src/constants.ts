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
  email: 'info@ghimnatrotta.it',         // aggiorna se diverso
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

export const COURSES_INFO: Record<string, { label: string; emoji: string; color: string }> = {
  programmafc: { label: 'Programma FC', emoji: '🏆', color: '#C0392B' },
  pilates:     { label: 'Pilates',       emoji: '🧘', color: '#5D6D7E' },
  yoga:        { label: 'Hatha Yoga',    emoji: '☯️',  color: '#7D6608' },
  functional:  { label: 'Functional Training', emoji: '💪', color: '#1A5276' },
  bodyflying:  { label: 'Body Flying',   emoji: '🪂', color: '#1E8449' },
  pump:        { label: 'Pump',          emoji: '🏋️', color: '#6C3483' },
  boxe:        { label: 'Boxe Training', emoji: '🥊', color: '#784212' },
  ritmica:     { label: 'Ginnastica Ritmica', emoji: '🎀', color: '#B7950B' },
};

export const DAYS_IT = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];

export const MEMBERSHIP_LABELS: Record<string, string> = {
  active:    '✅ Attivo',
  expired:   '❌ Scaduto',
  suspended: '⏸️ Sospeso',
  trial:     '🆕 Prova',
};
