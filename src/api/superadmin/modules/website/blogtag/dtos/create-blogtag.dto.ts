import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export const createblogTagSchema = z
  .object({
    title: z
      .string({ required_error: 'Title is required' })
      .trim()
      .min(3)
      .max(50)
      .toLowerCase(),
  })
  .strict({});

export class createblogTagDto extends createZodDto(createblogTagSchema) {}
