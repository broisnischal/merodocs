import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export const createProblemSchema = z
  .object({
    message: z
      .string({ required_error: 'Message is required' })
      .min(3, { message: 'Message must be at least 3 characters long' })
      .max(400, { message: 'Message cannot exceed 400 characters' }),
  })
  .strict({});

export class createProblemDto extends createZodDto(createProblemSchema) {}
