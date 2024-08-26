import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';
import { HomeEnum } from '@prisma/client';

export const createWhyUsSectionSchema = z
  .object({
    title: z.string().trim().min(3).max(100).optional(),
    type: z.nativeEnum(HomeEnum, {
      required_error: 'Please select where you are modifying this section.',
    }),
  })
  .strict({});

export class createWhyUsSectionDto extends createZodDto(
  createWhyUsSectionSchema,
) {}
