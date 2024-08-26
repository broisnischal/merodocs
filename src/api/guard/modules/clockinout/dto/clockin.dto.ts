import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export const clockInOutSchema = z
  .object({
    guardId: z.string({ required_error: 'Time is required' }).uuid(),
  })
  .strict();

export class clockInOutDto extends createZodDto(clockInOutSchema) {}
