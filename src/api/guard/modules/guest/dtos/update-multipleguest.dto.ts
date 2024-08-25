import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export const updateMultipleGuestSchema = z
  .object({
    id: z.string({ required_error: 'Id is required' }),
  })
  .strict();

export class updateMultipleGuestDto extends createZodDto(
  updateMultipleGuestSchema,
) {}
