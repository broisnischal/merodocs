import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export const checkInGuestSchema = z
  .object({
    code: z.string({ required_error: 'Code is required' }),
  })
  .strict();

export class checkInGuestDto extends createZodDto(checkInGuestSchema) {}
