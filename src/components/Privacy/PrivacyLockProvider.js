'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { useSession } from 'next-auth/react';
import PrivacyLockPrompt from './PrivacyLockPrompt';

const PrivacyLockContext = createContext({
  isLocked: false,
  isUnlocked: false,
  unlock: () => {},
  lock: () => {},
});

const PIN_STORAGE_KEY = 'privacyLockPIN';
const LOCK_ENABLED_KEY = 'privacyLockEnabled';
const UNLOCK_SESSION_KEY = 'privacyLockUnlocked';
const UNLOCK_TIMESTAMP_KEY = 'privacyLockUnlockedAt';
const UNLOCK_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

export function usePrivacyLock() {
  return useContext(PrivacyLockContext);
}

export default function PrivacyLockProvider({ children }) {
  const { data: session, status } = useSession();
  const [isLocked, setIsLocked] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [lockEnabled, setLockEnabled] = useState(false);

  // Check if lock is enabled and if user is unlocked
  useEffect(() => {
    if (status === 'loading') {
      return; // Wait for session to load
    }

    // Only check lock if user is authenticated
    if (status === 'authenticated' && session?.user) {
      checkLockStatus();
    } else {
      // If not authenticated, no lock needed
      setIsChecking(false);
      setIsLocked(false);
      setIsUnlocked(true);
    }
  }, [status, session]);

  const lock = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(UNLOCK_SESSION_KEY);
      sessionStorage.removeItem(UNLOCK_TIMESTAMP_KEY);
    }
    setIsLocked(true);
    setIsUnlocked(false);
  };

  // Listen for manual lock requests (from settings page)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleLockRequest = () => {
      if (lockEnabled) {
        lock();
      }
    };

    window.addEventListener('privacyLock:lock', handleLockRequest);
    return () => window.removeEventListener('privacyLock:lock', handleLockRequest);
  }, [lockEnabled]);

  const checkLockStatus = async () => {
    try {
      setIsChecking(true);

      // Log debug information about storage state
      if (typeof window !== 'undefined') {
        console.log('Privacy Lock Debug:', {
          localStoragePIN: localStorage.getItem(PIN_STORAGE_KEY) ? 'exists' : 'not found',
          localStorageEnabled: localStorage.getItem(LOCK_ENABLED_KEY),
          sessionStorageUnlocked: sessionStorage.getItem(UNLOCK_SESSION_KEY),
          sessionStorageTimestamp: sessionStorage.getItem(UNLOCK_TIMESTAMP_KEY),
        });
      }

      // Check if lock is enabled from backend
      const response = await fetch('/api/user/privacy');
      if (response.ok) {
        const data = await response.json();
        const backendLockEnabled = data.privacyLockEnabled || false;
        setLockEnabled(backendLockEnabled);

        // Also check localStorage as fallback
        const localLockEnabled = typeof window !== 'undefined'
          ? localStorage.getItem(LOCK_ENABLED_KEY) === 'true'
          : false;

        // Check if PIN exists - this is a critical check
        const pinExists = typeof window !== 'undefined' &&
          localStorage.getItem(PIN_STORAGE_KEY) !== null;

        // Only consider lock enabled if both flag is enabled AND PIN exists
        // This ensures disabling works even if one mechanism fails
        const lockIsEnabled = (backendLockEnabled || localLockEnabled) && pinExists;

        console.log('Lock status check:', {
          backendEnabled: backendLockEnabled,
          localEnabled: localLockEnabled,
          pinExists,
          finalDecision: lockIsEnabled
        });

        if (!lockIsEnabled) {
          // Lock not enabled, allow access and clean up any residual storage
          if (typeof window !== 'undefined') {
            // Clean up all storage to avoid persistence issues
            localStorage.removeItem(PIN_STORAGE_KEY);
            localStorage.removeItem(LOCK_ENABLED_KEY);
            sessionStorage.removeItem(UNLOCK_SESSION_KEY);
            sessionStorage.removeItem(UNLOCK_TIMESTAMP_KEY);
          }

          setIsLocked(false);
          setIsUnlocked(true);
          setIsChecking(false);
          return;
        }

        // Lock is enabled - check if user is already unlocked
        const unlocked = checkUnlockStatus();

        if (unlocked) {
          setIsLocked(false);
          setIsUnlocked(true);
        } else {
          setIsLocked(true);
          setIsUnlocked(false);
        }
      } else {
        // If API fails, check localStorage only
        const localLockEnabled = typeof window !== 'undefined'
          ? localStorage.getItem(LOCK_ENABLED_KEY) === 'true'
          : false;

        // Check if PIN exists
        const pinExists = typeof window !== 'undefined' &&
          localStorage.getItem(PIN_STORAGE_KEY) !== null;

        // Only lock if both conditions are true
        const shouldLock = localLockEnabled && pinExists;

        if (shouldLock) {
          const unlocked = checkUnlockStatus();
          setIsLocked(!unlocked);
          setIsUnlocked(unlocked);
        } else {
          // Clean up any residual storage
          if (typeof window !== 'undefined') {
            localStorage.removeItem(PIN_STORAGE_KEY);
            localStorage.removeItem(LOCK_ENABLED_KEY);
            sessionStorage.removeItem(UNLOCK_SESSION_KEY);
            sessionStorage.removeItem(UNLOCK_TIMESTAMP_KEY);
          }

          setIsLocked(false);
          setIsUnlocked(true);
        }
      }
    } catch (error) {
      console.error('Error checking privacy lock status:', error);
      // On error, allow access (fail open)
      setIsLocked(false);
      setIsUnlocked(true);
    } finally {
      setIsChecking(false);
    }
  };

  const checkUnlockStatus = () => {
    if (typeof window === 'undefined') return false;

    // Check if unlocked in this session
    const unlocked = sessionStorage.getItem(UNLOCK_SESSION_KEY) === 'true';
    if (!unlocked) return false;

    // Check if unlock has expired (30 minutes)
    const unlockedAt = sessionStorage.getItem(UNLOCK_TIMESTAMP_KEY);
    if (unlockedAt) {
      const unlockTime = parseInt(unlockedAt, 10);
      const now = Date.now();
      if (now - unlockTime > UNLOCK_TIMEOUT) {
        // Unlock expired
        sessionStorage.removeItem(UNLOCK_SESSION_KEY);
        sessionStorage.removeItem(UNLOCK_TIMESTAMP_KEY);
        return false;
      }
    }

    return true;
  };

  const unlock = (pin) => {
    if (typeof window === 'undefined') return false;

    const storedPin = localStorage.getItem(PIN_STORAGE_KEY);
    if (!storedPin) {
      // No PIN stored, allow unlock (lock was disabled)
      setIsLocked(false);
      setIsUnlocked(true);
      return true;
    }

    if (pin === storedPin) {
      // Correct PIN - unlock
      sessionStorage.setItem(UNLOCK_SESSION_KEY, 'true');
      sessionStorage.setItem(UNLOCK_TIMESTAMP_KEY, Date.now().toString());
      setIsLocked(false);
      setIsUnlocked(true);
      return true;
    }

    return false;
  };

  // Re-check lock status when window regains focus (in case user switched tabs)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleFocus = () => {
      if (lockEnabled && isUnlocked) {
        // Check if unlock has expired
        const unlocked = checkUnlockStatus();
        if (!unlocked) {
          lock();
        }
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [lockEnabled, isUnlocked]);

  // Show loading state while checking
  if (isChecking) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f5f5f5'
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <PrivacyLockContext.Provider value={{ isLocked, isUnlocked, unlock, lock }}>
      {isLocked ? (
        <PrivacyLockPrompt onUnlock={unlock} />
      ) : (
        children
      )}
    </PrivacyLockContext.Provider>
  );
}

