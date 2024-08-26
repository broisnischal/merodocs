import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export const updateWhyUsCardSchema = z
  .object({
    title: z.string().trim().min(3).max(100).toLowerCase().optional(),
    description: z.string().trim().min(3).max(220).optional(),
  })
  .strict({});

export class updateWhyUsCardDto extends createZodDto(updateWhyUsCardSchema) {}
