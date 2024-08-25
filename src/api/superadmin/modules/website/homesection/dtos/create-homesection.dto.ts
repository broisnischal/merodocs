import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';
import { HomeEnum } from '@prisma/client';

export const createHomeSectionSchema = z
  .object({
    title: z.string().trim().min(3).max(100).optional(),
    description: z.string().trim().min(3).max(250).optional(),
    for: z.nativeEnum(HomeEnum, {
      required_error: 'Please select where you are modifying this section.',
    }),
  })
  .strict({});

export class createHomeSectionDto extends createZodDto(
  createHomeSectionSchema,
) {}
