import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export const updateAboutUsServiceSchema = z
  .object({
    title: z.string().trim().min(3).max(100).optional(),
    description: z.string().trim().min(3).max(220).optional(),
  })
  .strict({});

export class updateAboutUsServiceDto extends createZodDto(
  updateAboutUsServiceSchema,
) {}
