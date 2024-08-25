import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export const updateFAQSchema = z
  .object({
    question: z.string().trim().min(3).max(100).optional(),
    answer: z.string().trim().min(3).max(300).optional(),
  })
  .strict({});

export class updateFAQDto extends createZodDto(updateFAQSchema) {}
