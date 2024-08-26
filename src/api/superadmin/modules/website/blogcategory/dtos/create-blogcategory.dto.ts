import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export const createblogCategorySchema = z
  .object({
    title: z
      .string({ required_error: 'Title is required' })
      .trim()
      .min(3)
      .max(50),
  })
  .strict({});

export class createblogCategoryDto extends createZodDto(
  createblogCategorySchema,
) {}
