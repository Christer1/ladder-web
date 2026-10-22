// Zustand store: email, completed steps, selected credential. Never passwords, OTPs or BVN/NIN values.
// Not persisted (rules.md §12): a hard refresh starts the flow again.
import { create } from 'zustand';
import type { OnboardingStep } from '@/config/routes';

export type CredentialType = 'bvn' | 'nin' | 'government-id';

type OnboardingState = {
  email: string | null;
  /** Seconds until a new OTP can be requested, as returned by signup. */
  resendAvailableIn: number | null;
  completedSteps: OnboardingStep[];
  selectedCredential: CredentialType | null;
};

type OnboardingActions = {
  startSignup: (email: string, resendAvailableIn: number) => void;
  completeStep: (step: OnboardingStep) => void;
  selectCredential: (credential: CredentialType | null) => void;
  reset: () => void;
};

const initialState: OnboardingState = {
  email: null,
  resendAvailableIn: null,
  completedSteps: [],
  selectedCredential: null,
};

export const useOnboardingStore = create<OnboardingState & OnboardingActions>()((set) => ({
  ...initialState,
  startSignup: (email, resendAvailableIn) =>
    set((state) => ({
      email,
      resendAvailableIn,
      completedSteps: state.completedSteps.includes('signup')
        ? state.completedSteps
        : [...state.completedSteps, 'signup'],
    })),
  completeStep: (step) =>
    set((state) =>
      state.completedSteps.includes(step)
        ? state
        : { completedSteps: [...state.completedSteps, step] },
    ),
  selectCredential: (selectedCredential) => set({ selectedCredential }),
  reset: () => set(initialState),
}));
