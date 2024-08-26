import { FlatTypeEnum } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export const updateFlatSchema = z
  .object({
    name: z
      .string({ required_error: 'Floor is required' })
      .min(1, { message: 'Name must be at least 1 characters long' })
      .max(20, { message: 'Name cannot exceed 20 characters' })
      .regex(/^[a-zA-Z0-9\s]+$/, {
        message: 'Name must only contain letters, numbers, and spaces',
      })
      .toUpperCase()
      .optional(),
    type: z.nativeEnum(FlatTypeEnum).optional(),
  })
  .strict();

export class updateFlatDto extends createZodDto(updateFlatSchema) {}
