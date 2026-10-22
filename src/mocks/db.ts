// State for the steps ladder-backend does not serve yet (Government ID, liveness).
// Everything else comes from the real backend. Mirrored to sessionStorage so a page reload keeps
// your progress while developing. Only statuses and a fallback Ladder ID are kept: never files or
// selfies (rules.md §12).
import type { VerificationStepStatus } from '@/features/verification/types/verification.types';

type MockDb = {
  governmentId: VerificationStepStatus;
  liveness: VerificationStepStatus;
  /** Used only when the backend has not issued one (a Government ID instead of BVN/NIN). */
  ladderId: string | null;
};

const STORAGE_KEY = 'ladder-mock-db';

const emptyDb = (): MockDb => ({
  governmentId: 'NOT_STARTED',
  liveness: 'NOT_STARTED',
  ladderId: null,
});

function load(): MockDb {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return { ...emptyDb(), ...(JSON.parse(raw) as Partial<MockDb>) };
  } catch {
    // Storage blocked or corrupt: start fresh.
  }
  return emptyDb();
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
  /** A new account or session: forget the previous one's mocked steps. */
  reset() {
    db = emptyDb();
    save();
  },
  update(patch: Partial<MockDb>) {
    db = { ...db, ...patch };
    save();
  },
};

export function generateLadderId(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const block = () =>
    Array.from({ length: 4 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
  return `LID-${block()}-${block()}`;
}
