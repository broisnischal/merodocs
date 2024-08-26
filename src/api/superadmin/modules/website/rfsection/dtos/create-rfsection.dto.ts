import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export const createRFSectionSchema = z
  .object({
    title: z
      .string({ required_error: 'Title is required' })
      .trim()
      .min(3)
      .max(100),
  })
  .strict({});

export class createRFSectionDto extends createZodDto(createRFSectionSchema) {}
