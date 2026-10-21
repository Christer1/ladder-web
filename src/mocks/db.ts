// In-memory "backend" state shared by the MSW handlers.
// Mirrored to sessionStorage so a page reload keeps your progress while developing.
// Only statuses, the email and the Ladder ID are kept: never PIN, DOB, BVN, NIN, files or selfies (rules.md §12).
import type { VerificationStatus } from '@/features/verification/types/verification.types';

type MockDb = {
  email: string | null;
  hasSession: boolean;
  status: VerificationStatus;
};

const STORAGE_KEY = 'ladder-mock-db';

const emptyStatus = (): VerificationStatus => ({
  dateOfBirth: 'not_started',
  bvn: 'not_started',
  nin: 'not_started',
  governmentId: 'not_started',
  liveness: 'not_started',
  ladderId: null,
});

function load(): MockDb {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as MockDb;
  } catch {
    // Storage blocked or corrupt: start fresh.
  }
  return { email: null, hasSession: false, status: emptyStatus() };
}

let db: MockDb = load();

function save() {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    // Not critical for mocks.
  }
}

export const mockDb = {
  get: (): Readonly<MockDb> => db,
  startSignup(email: string) {
    db = { email, hasSession: false, status: emptyStatus() };
    save();
  },
  startSession() {
    db = { ...db, hasSession: true };
    save();
  },
  updateStatus(patch: Partial<VerificationStatus>) {
    db = { ...db, status: { ...db.status, ...patch } };
    save();
  },
};

export function generateLadderId(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const block = () =>
    Array.from({ length: 4 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
  return `LID-${block()}-${block()}`;
}
