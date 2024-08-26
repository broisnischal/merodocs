import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export const updateVideoSectionSchema = z
  .object({
    title: z.string().max(100).optional(),
  })
  .strict({});

export class updateVideoSectionDto extends createZodDto(
  updateVideoSectionSchema,
) {}
