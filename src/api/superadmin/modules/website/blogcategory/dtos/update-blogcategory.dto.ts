import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export const blogCategorySchema = z
  .object({
    title: z
      .string({ required_error: 'Title is required' })
      .trim()
      .min(3)
      .max(50),
  })
  .strict({});

export class updateblogCategoryDto extends createZodDto(blogCategorySchema) {}
