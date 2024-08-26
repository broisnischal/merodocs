import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';
import { contactSchema } from 'src/common/validator/body.validator';

const verifyChangeNumberWithEmail = z.object({
  code: z
    .string({ required_error: 'Code is required' })
    .refine((value) => /^[0-9]{6}$/.test(value), {
      message: 'Invalid Code',
    }),
});

export class verifyChangeNumberWithEmailDto extends createZodDto(
  verifyChangeNumberWithEmail,
) {}

const verifyChangeNumber = z.object({
  code: z.string({ required_error: 'Code is required' }),
  contact: contactSchema(),
});

export class verifyChangeNumberDto extends createZodDto(verifyChangeNumber) {}
