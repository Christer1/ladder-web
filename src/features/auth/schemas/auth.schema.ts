// Zod schemas: signupSchema, otpSchema, pinSchema.
import { z } from 'zod';

export const OTP_LENGTH = 6;
export const PIN_LENGTH = 6;
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;
export const PASSWORD_HINT = `At least ${PASSWORD_MIN_LENGTH} characters, including a letter and a number`;

export const signupSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Enter your email address')
    .pipe(z.email('Enter a valid email address')),
  password: z
    .string()
    .min(1, 'Enter a password')
    .min(PASSWORD_MIN_LENGTH, `Use at least ${PASSWORD_MIN_LENGTH} characters`)
    .max(PASSWORD_MAX_LENGTH, `Use ${PASSWORD_MAX_LENGTH} characters or fewer`)
    .regex(/[A-Za-z]/, 'Include at least one letter')
    .regex(/\d/, 'Include at least one number'),
});

export type SignupFormValues = z.infer<typeof signupSchema>;

const digits = (length: number, label: string) =>
  z.string().regex(new RegExp(`^\\d{${length}}$`), `Enter the ${length}-digit ${label}`);

export const otpSchema = z.object({
  code: digits(OTP_LENGTH, 'code'),
});

export type OtpFormValues = z.infer<typeof otpSchema>;

export const pinSchema = z
  .object({
    pin: digits(PIN_LENGTH, 'PIN'),
    confirmPin: digits(PIN_LENGTH, 'PIN'),
  })
  .refine((values) => values.pin === values.confirmPin, {
    message: 'PINs do not match',
    path: ['confirmPin'],
  });

export type PinFormValues = z.infer<typeof pinSchema>;
