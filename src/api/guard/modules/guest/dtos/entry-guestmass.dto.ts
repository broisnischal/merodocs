import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export const entryGuestMassSchema = z
  .object({
    entered: z
      .number({ required_error: 'Entered number is required' })
      .transform((val) => Number(val))
      .refine((value) => value !== undefined && value >= 2 && value <= 1000, {
        message: 'Number of guests must be between 2 and 1000',
      }),
  })
  .strict();

export class entryGuestMassDto extends createZodDto(entryGuestMassSchema) {}
