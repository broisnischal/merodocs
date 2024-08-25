import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export const createFeedbackSchema = z
  .object({
    message: z
      .string({ required_error: 'Message is required' })
      .min(3, { message: 'Message must be at least 3 characters long' })
      .max(1000, { message: 'Message cannot exceed 1000 characters' }),
  })
  .strict({});

export class createFeedbackDto extends createZodDto(createFeedbackSchema) {}
