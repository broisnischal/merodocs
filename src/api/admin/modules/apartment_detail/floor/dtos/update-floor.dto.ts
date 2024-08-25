import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export const updateFloorSchema = z
  .object({
    name: z
      .string()
      .min(3, { message: 'Name must be at least 3 characters long' })
      .max(20, { message: 'Name cannot exceed 20 characters' })
      .regex(/^[a-zA-Z0-9\s]+$/, {
        message: 'Name must only contain letters, numbers, and spaces',
      })
      .toUpperCase(),
  })
  .strict();

export class updateFloorDto extends createZodDto(updateFloorSchema) {}
