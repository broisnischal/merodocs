import { z } from 'nestjs-zod/z';

const today = new Date();
const minAgeDate = new Date(
  today.getFullYear() - 18,
  today.getMonth(),
  today.getDate(),
);

export const validateDateOfBirth = (value: string, ctx: z.RefinementCtx) => {
  const dob = new Date(value);

  if (isNaN(dob.getTime())) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Invalid Date',
    });
  }

  dob.setHours(0);
  dob.setMinutes(0);
  dob.setSeconds(0);

  if (dob >= minAgeDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Age must be above 18',
    });
  }

  return dob;
};
