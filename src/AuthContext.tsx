// ============================================================
// GHIMNA TROTTA 2.0 — AuthContext.tsx
// ============================================================

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth, googleProvider } from './firebase';
import { GhimnaUser } from './types';

// ---- Tipo del contesto -------------------------------------
interface AuthContextType {
  user: GhimnaUser | null;
  firebaseUser: any | null;
  loading: boolean;
  emailVerified: boolean;
  needsProfile: boolean;

  loginEmail: (email: string, password: string) => Promise<void>;
  loginGoogle: () => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  updateProfile: (data: Partial<GhimnaUser>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// ---- Provider ----------------------------------------------
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<any | null>(null);
  const [user, setUser]                 = useState<GhimnaUser | null>(null);
  const [loading, setLoading]           = useState(true);
  const [emailVerified, setEmailVerified] = useState(false);
  const [needsProfile, setNeedsProfile] = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function loadUserProfile(uid: string): Promise<GhimnaUser | null> {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      ...data,
      uid,
      membershipExpiry: data.membershipExpiry?.toDate?.() ?? null,
      createdAt: data.createdAt?.toDate?.() ?? new Date(),
    } as GhimnaUser;
  }

  async function createUserProfile(fbUser: any, displayName?: string) {
    const newUser: Omit<GhimnaUser, 'uid'> = {
      email: fbUser.email ?? '',
      displayName: displayName ?? fbUser.displayName ?? 'Socio',
      avatarUrl: fbUser.photoURL ?? null,
      role: 'member',
      membershipStatus: 'trial',
      membershipExpiry: null,
      prefs: { notifications: true, language: 'it' },
      createdAt: new Date(),
    };
    await setDoc(doc(db, 'users', fbUser.uid), {
      ...newUser,
      createdAt: serverTimestamp(),
    });
    return { ...newUser, uid: fbUser.uid } as GhimnaUser;
  }

  function startEmailVerificationPoll(fbUser: any) {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      await fbUser.reload();
      if (fbUser.emailVerified) {
        setEmailVerified(true);
        clearInterval(pollRef.current!);
        pollRef.current = null;
      }
    }, 3000);
  }

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (fbUser: any) => {
      setLoading(true);
      if (fbUser) {
        setFirebaseUser(fbUser);
        setEmailVerified(fbUser.emailVerified);

        if (!fbUser.emailVerified) {
          startEmailVerificationPoll(fbUser);
        }

        let profile = await loadUserProfile(fbUser.uid);
        if (!profile) {
          profile = await createUserProfile(fbUser);
          setNeedsProfile(true);
        } else {
          setNeedsProfile(!profile.displayName || profile.displayName === 'Socio');
        }
        setUser(profile);
      } else {
        setFirebaseUser(null);
        setUser(null);
        setEmailVerified(false);
        if (pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  async function loginEmail(email: string, password: string) {
    await auth.signInWithEmailAndPassword(email, password);
  }

  async function loginGoogle() {
    await auth.signInWithPopup(googleProvider);
  }

  async function register(email: string, password: string, displayName: string) {
    const cred = await auth.createUserWithEmailAndPassword(email, password);
    await cred.user?.updateProfile({ displayName });
    await cred.user?.sendEmailVerification();
    await createUserProfile(cred.user!, displayName);
  }

  async function logout() {
    await auth.signOut();
  }

  async function sendVerificationEmail() {
    if (firebaseUser && !firebaseUser.emailVerified) {
      await firebaseUser.sendEmailVerification();
    }
  }

  async function updateProfile(data: Partial<GhimnaUser>) {
    if (!user) return;

    if (data.avatarUrl) {
      data.avatarUrl = data.avatarUrl.split('&token=')[0];
    }

    await setDoc(doc(db, 'users', user.uid), data, { merge: true });
    setUser((prev) => (prev ? { ...prev, ...data } : prev));

    if (data.displayName && firebaseUser) {
      await firebaseUser.updateProfile({ displayName: data.displayName });
    }
  }

  const value: AuthContextType = {
    user,
    firebaseUser,
    loading,
    emailVerified,
    needsProfile,
    loginEmail,
    loginGoogle,
    register,
    logout,
    sendVerificationEmail,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve essere usato dentro AuthProvider');
  return ctx;
}