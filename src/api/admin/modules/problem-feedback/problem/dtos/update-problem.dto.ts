import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export const updateProblemSchema = z
  .object({
    topic: z
      .string({ required_error: 'Topic is required' })
      .min(3, { message: 'Topic must be at least 3 characters long' })
      .max(100, { message: 'Topic cannot exceed 100 characters' })
      .optional(),

    message: z
      .string({ required_error: 'Message is required' })
      .min(3, { message: 'Message must be at least 3 characters long' })
      .max(1000, { message: 'Message cannot exceed 1000 characters' })
      .optional(),
  })
  .strict({});

export class updateProblemDto extends createZodDto(updateProblemSchema) {}
