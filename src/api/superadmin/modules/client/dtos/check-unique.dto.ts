import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export const checkUniqueSchema = z
  .object({
    email: z
      .string({ required_error: 'Email is required' })
      .email('Invalid email or malicious activities traced...')
      .transform((value) => {
        return value.toLowerCase();
      })
      .optional(),

    apartmentname: z
      .string()
      .min(5, { message: 'Name must be at least 5 characters long' })
      .max(30, { message: 'Name cannot exceed 30 characters' })
      .regex(/^[a-zA-Z0-9\s]+$/, {
        message: 'Name must only contain letters, numbers, and spaces',
      })
      .transform((value) => {
        return value.toLowerCase();
      })
      .optional(),
  })
  .strict();

export class checkUniqueDto extends createZodDto(checkUniqueSchema) {}
