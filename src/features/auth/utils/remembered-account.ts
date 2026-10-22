// "Remember this device" for returning users: only the email of the last account that signed in,
// so the login screen can pre-fill it. Never the password or session (rules.md §12).
// Stored in localStorage; every access is wrapped because storage can be blocked.
'use client';

import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'ladder:returning-account';
const CHANGE_EVENT = 'ladder:returning-account-change';

function read(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function write(email: string | null) {
  try {
    if (email) localStorage.setItem(STORAGE_KEY, email);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Private mode or blocked storage: the user just types their email next time.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export const rememberAccount = (email: string) => write(email.trim().toLowerCase());

function subscribe(onChange: () => void) {
  // `storage` covers other tabs; the custom event covers this one.
  window.addEventListener('storage', onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

/**
 * The remembered email, or null. `undefined` while rendering on the server / before hydration,
 * so callers can wait instead of flashing the wrong form.
 */
export function useRememberedAccount(): string | null | undefined {
  return useSyncExternalStore(subscribe, read, () => undefined);
}
