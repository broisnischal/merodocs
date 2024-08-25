import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export const updateEmailSchema = z
  .object({
    email: z
      .string({ required_error: 'Email is required' })
      .email('Invalid Email Format')
      .transform((value) => {
        return value.toLowerCase();
      }),
  })
  .strict();

export class updateEmailDto extends createZodDto(updateEmailSchema) {}
