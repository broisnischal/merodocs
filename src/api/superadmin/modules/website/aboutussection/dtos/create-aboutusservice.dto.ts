import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export const createAboutUsServiceSchema = z
  .object({
    title: z
      .string({ required_error: 'Title is required' })
      .trim()
      .min(3)
      .max(100)
      .toLowerCase(),
    description: z
      .string({ required_error: 'Description is required' })
      .trim()
      .min(3)
      .max(220),
  })
  .strict({});

export class createAboutUsServiceDto extends createZodDto(
  createAboutUsServiceSchema,
) {}
