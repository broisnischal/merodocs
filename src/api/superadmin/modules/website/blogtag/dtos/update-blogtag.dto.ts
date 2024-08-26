import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export const blogTitleSchema = z
  .object({
    title: z
      .string({ required_error: 'Title is required' })
      .trim()
      .min(3)
      .max(50)
      .toLowerCase(),
  })
  .strict({});

export class updateblogTitleDto extends createZodDto(blogTitleSchema) {}
