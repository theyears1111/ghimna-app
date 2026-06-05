// ============================================================
// GHIMNA TROTTA 2.0 — types.ts
// ============================================================

export type UserRole = 'member' | 'trainer' | 'admin';
export type MembershipStatus = 'active' | 'expired' | 'suspended' | 'trial';

export type CourseCategory =
  | 'programmafc'
  | 'pilates'
  | 'yoga'
  | 'functional'
  | 'bodyflying'
  | 'pump'
  | 'boxe'
  | 'ritmica';

// ---- Navigazione custom (NO react-router) ------------------
export type PageType =
  | 'HOME'
  | 'LOGIN'
  | 'REGISTER'
  | 'VERIFY_EMAIL'
  | 'DASHBOARD'
  | 'COURSES'
  | 'COURSE_DETAIL'
  | 'PROFILE'
  | 'NOTIFICATIONS'
  | 'ADMIN'
  | 'ADMIN_MEMBERS'
  | 'ADMIN_COURSES'
  | 'ADMIN_AVVISI'
  | 'ADMIN_IMPOSTAZIONI'
  | 'ADMIN_STATISTICHE'
  | 'ADMIN_PRESENZE';

export interface RouteState {
  page: PageType;
  courseId?: string;
  userId?: string;
}

// ---- Utente ------------------------------------------------
export interface GhimnaUser {
  uid: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  role: UserRole;
  phone?: string;
  bio?: string;           // aggiunto per profilo istruttore
  specialties?: string[]; // aggiunto per profilo istruttore
  membershipStatus: MembershipStatus;
  membershipExpiry?: Date | null;
  fcmToken?: string;
  prefs: {
    notifications: boolean;
    language: 'it' | 'en';
  };
  createdAt: Date;
}

// ---- Corso -------------------------------------------------
export interface CourseSchedule {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  currentBookings: number;
  maxCapacity: number;
}

export interface Course {
  id: string;
  title: string;
  category: CourseCategory;
  description: string;
  trainerId: string;
  trainerName: string;
  imageUrl?: string;
  schedule: CourseSchedule[];
  capacity: number;
  isFlagship?: boolean;
  isActive: boolean;
  tags?: string[];
}

// ---- Prenotazione ------------------------------------------
export interface Booking {
  id: string;
  userId: string;
  courseId: string;
  scheduleId: string;
  courseName: string;
  date: Date;
  startTime: string;
  status: 'confirmed' | 'cancelled' | 'waitlist';
  createdAt: Date;
}

// ---- Notifica ----------------------------------------------
export type NotificationType =
  | 'booking_confirm'
  | 'booking_cancel'
  | 'membership_expiry'
  | 'new_course'
  | 'general';

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

// ---- Istruttore --------------------------------------------
export interface Trainer {
  id: string;
  name: string;
  bio: string;
  avatarUrl?: string;
  specialties: CourseCategory[];
  instagramUrl?: string;
}

// ---- Configurazione palestra --------------------------------
export interface GymConfig {
  openHours: {
    weekdays: string;
    saturday: string;
    sunday: string;
  };
  announcementBanner?: string;
  skipresUrl: string;
}