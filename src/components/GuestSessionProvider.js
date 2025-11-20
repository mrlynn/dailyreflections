'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { createStorageService } from '@/lib/storage/storageService';

const GuestSessionContext = createContext({
  mode: 'guest',
  isGuest: true,
  guestId: null,
  storage: createStorageService('guest'),
  upgradeToAccount: () => {},
  isReady: false,
});

const GUEST_ID_STORAGE_KEY = 'guest_user_id';

const isBrowser = () => typeof window !== 'undefined';

let inMemoryGuestId = null;

function generateGuestId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

function getOrCreateGuestId() {
    if (!isBrowser()) return null;
    try {
      let id = window.localStorage.getItem(GUEST_ID_STORAGE_KEY);
      if (!id) {
        id = generateGuestId();
        window.localStorage.setItem(GUEST_ID_STORAGE_KEY, id);
      }
      inMemoryGuestId = id;
      return id;
    } catch (error) {
      console.warn('Unable to access localStorage for guest ID, falling back to in-memory storage:', error);
      if (!inMemoryGuestId) {
        inMemoryGuestId = generateGuestId();
      }
      return inMemoryGuestId;
    }
}

export function useGuestSession() {
  return useContext(GuestSessionContext);
}

export default function GuestSessionProvider({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mode, setMode] = useState('guest');
  const [guestId, setGuestId] = useState(null);

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      setMode('authenticated');
    } else if (status === 'unauthenticated') {
      setMode('guest');
    }
  }, [status, session]);

  useEffect(() => {
    if (mode === 'guest') {
      const id = getOrCreateGuestId();
      setGuestId(id);
    }
  }, [mode]);

  const storage = useMemo(() => {
    if (mode === 'guest') {
      return createStorageService(mode, { guestId: guestId || 'default' });
    }
    return createStorageService(mode);
  }, [mode, guestId]);

  const upgradeToAccount = () => {
    if (mode === 'authenticated') {
      return;
    }
    router.push('/register?source=guest');
  };

  const isReady = useMemo(() => {
    if (mode === 'guest') {
      return guestId !== null || !isBrowser();
    }
    return status !== 'loading';
  }, [mode, guestId, status]);

  const contextValue = useMemo(() => ({
    mode,
    isGuest: mode === 'guest',
    guestId,
    storage,
    upgradeToAccount,
    isReady,
  }), [mode, guestId, storage, upgradeToAccount, isReady]);

  return (
    <GuestSessionContext.Provider value={contextValue}>
      {children}
    </GuestSessionContext.Provider>
  );
}

