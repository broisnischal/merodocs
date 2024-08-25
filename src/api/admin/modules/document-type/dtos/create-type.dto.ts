import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export const createDocumentTypeSchema = z
  .object({
    name: z
      .string({ required_error: 'Name is required' })
      .min(3, { message: 'Name must be at least 3 characters long' })
      .max(50, { message: 'Name cannot exceed 50 characters' }),
  })
  .strict({});

export class createDocumentTypeDto extends createZodDto(
  createDocumentTypeSchema,
) {}
