// Zustand store: email, completed steps, selected credential. Never PIN/BVN/NIN values.
// Not persisted (rules.md §12): a hard refresh starts the flow again.
import { create } from 'zustand';
import type { OnboardingStep } from '@/config/routes';

export type CredentialType = 'bvn' | 'nin' | 'government-id';

type OnboardingState = {
  email: string | null;
  /** Seconds until the current OTP expires, as returned by signup/resend. */
  otpExpiresIn: number | null;
  completedSteps: OnboardingStep[];
  selectedCredential: CredentialType | null;
};

type OnboardingActions = {
  startSignup: (email: string, otpExpiresIn: number) => void;
  completeStep: (step: OnboardingStep) => void;
  selectCredential: (credential: CredentialType | null) => void;
  reset: () => void;
};

const initialState: OnboardingState = {
  email: null,
  otpExpiresIn: null,
  completedSteps: [],
  selectedCredential: null,
};

export const useOnboardingStore = create<OnboardingState & OnboardingActions>()((set) => ({
  ...initialState,
  startSignup: (email, otpExpiresIn) =>
    set((state) => ({
      email,
      otpExpiresIn,
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
