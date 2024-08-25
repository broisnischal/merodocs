import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export const createAboutUsStorySchema = z
  .object({
    title: z.string().trim().min(3).max(100).optional(),
    description: z.string().trim().min(3).max(700).optional(),
  })
  .strict({});

export class createAboutUsStoryDto extends createZodDto(
  createAboutUsStorySchema,
) {}
