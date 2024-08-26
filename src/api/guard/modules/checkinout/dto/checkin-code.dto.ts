import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export const checkInCodeSchema = z
  .object({
    code: z.string({ required_error: 'Code is required' }),
  })
  .strict();

export class checkInCodeDto extends createZodDto(checkInCodeSchema) {}
