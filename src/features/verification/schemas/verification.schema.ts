// Zod schemas: dateOfBirthSchema (18+), idNumberSchemas.bvn / .nin (11 digits), idUploadSchema (front + back for cards, PNG/JPG/PDF, max 5MB each).
import { z } from 'zod';
import type { GovernmentIdType, IdSide } from '../types/verification.types';

/** Minimum age to get a Ladder ID. Confirm with product (rules.md §9). */
export const MIN_AGE = 18;
export const ID_NUMBER_LENGTH = 11;
export const MAX_ID_FILE_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_ID_FILE_TYPES = ['image/png', 'image/jpeg', 'application/pdf'] as const;

type GovernmentIdOption = {
  value: GovernmentIdType;
  label: string;
  /** Images to collect. Cards need front and back; a passport only its photo page. */
  sides: readonly IdSide[];
};

/** Placeholder list until product confirms the accepted IDs (rules.md §2, open question 2). */
export const GOVERNMENT_ID_OPTIONS: readonly GovernmentIdOption[] = [
  { value: 'national-id-card', label: 'National ID Card', sides: ['front', 'back'] },
  { value: 'international-passport', label: 'International Passport', sides: ['front'] },
  { value: 'drivers-licence', label: 'Driver’s Licence', sides: ['front', 'back'] },
  { value: 'voters-card', label: 'Voter’s Card', sides: ['front', 'back'] },
];

/** Sides to collect for an ID type. Before a type is chosen, assume a card (front and back). */
export function getIdSides(idType: GovernmentIdType | undefined): readonly IdSide[] {
  return (
    GOVERNMENT_ID_OPTIONS.find((option) => option.value === idType)?.sides ?? ['front', 'back']
  );
}

function ageOn(dateOfBirth: Date, today: Date): number {
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const hasHadBirthdayThisYear =
    today.getMonth() > dateOfBirth.getMonth() ||
    (today.getMonth() === dateOfBirth.getMonth() && today.getDate() >= dateOfBirth.getDate());
  if (!hasHadBirthdayThisYear) age -= 1;
  return age;
}

/** Parses YYYY-MM-DD as a local date; returns null for impossible dates like 2001-02-30. */
function parseIsoDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(year, month - 1, day);
  const isRealDate =
    date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  return isRealDate && year >= 1900 ? date : null;
}

export const dateOfBirthSchema = z.object({
  dateOfBirth: z
    .string()
    .min(1, 'Enter your date of birth')
    .superRefine((value, ctx) => {
      const date = parseIsoDate(value);
      const today = new Date();
      if (!date) {
        ctx.addIssue({ code: 'custom', message: 'Enter a valid date' });
      } else if (date >= today) {
        ctx.addIssue({ code: 'custom', message: 'Date of birth must be in the past' });
      } else if (ageOn(date, today) < MIN_AGE) {
        ctx.addIssue({
          code: 'custom',
          message: `You must be at least ${MIN_AGE} to get a Ladder ID`,
        });
      }
    }),
});

export type DateOfBirthFormValues = z.infer<typeof dateOfBirthSchema>;

const idNumber = (label: string) =>
  z
    .string()
    .regex(
      new RegExp(`^\\d{${ID_NUMBER_LENGTH}}$`),
      `Enter your ${ID_NUMBER_LENGTH}-digit ${label}`,
    );

/** One schema per kind for the single-field BVN/NIN forms. */
export const idNumberSchemas = {
  bvn: z.object({ value: idNumber('BVN') }),
  nin: z.object({ value: idNumber('NIN') }),
} as const;

export type IdNumberFormValues = z.infer<(typeof idNumberSchemas)['bvn']>;

const idImage = (missingMessage: string) =>
  z
    .instanceof(File, { message: missingMessage })
    .refine((file) => (ACCEPTED_ID_FILE_TYPES as readonly string[]).includes(file.type), {
      message: 'Use a PNG, JPG or PDF file',
    })
    .refine((file) => file.size <= MAX_ID_FILE_BYTES, {
      message: 'The file must be 5 MB or smaller',
    });

export const idUploadSchema = z
  .object({
    idType: z.enum(
      GOVERNMENT_ID_OPTIONS.map((option) => option.value) as [
        GovernmentIdType,
        ...GovernmentIdType[],
      ],
      'Select the type of ID',
    ),
    front: idImage('Add a photo of the front of your ID'),
    back: idImage('Add a photo of the back of your ID').optional(),
    isConfirmedValid: z
      .boolean()
      .refine((isConfirmed) => isConfirmed, 'Confirm this is a valid government-issued ID'),
  })
  .superRefine((values, ctx) => {
    if (getIdSides(values.idType).includes('back') && !values.back) {
      ctx.addIssue({
        code: 'custom',
        path: ['back'],
        message: 'Add a photo of the back of your ID',
      });
    }
  });

export type IdUploadFormValues = z.infer<typeof idUploadSchema>;

export function isAcceptedIdFileType(file: File): boolean {
  return (ACCEPTED_ID_FILE_TYPES as readonly string[]).includes(file.type);
}
