import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export const createColorSchema = z
  .object({
    name: z
      .string({ required_error: 'Color code is required' })
      .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
        message: 'Invalid color code format',
      }),
  })
  .strict({});

export class createColorDto extends createZodDto(createColorSchema) {}
