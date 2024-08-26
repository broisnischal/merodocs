import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

const requestEmailChangeSchema = z.object({
  email: z.string({ required_error: 'Email is required' }).email({
    message: 'Invalid email',
  }),
});

export class requestEmailChangeDto extends createZodDto(
  requestEmailChangeSchema,
) {}

const verifyEmailChangeSchema = z.object({
  code: z
    .string({ required_error: 'Code is required' })
    .refine((value) => /^[0-9]{6}$/.test(value), {
      message: 'Invalid Code',
    }),
});

export class verifyEmailChangeDto extends createZodDto(
  verifyEmailChangeSchema,
) {}
