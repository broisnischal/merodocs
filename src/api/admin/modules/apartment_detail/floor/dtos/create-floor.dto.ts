import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export const createFloorSchema = z
  .object({
    name: z
      .array(
        z
          .string({ required_error: 'Floor name is required' })
          .min(1, { message: 'Name must be at least 1 characters long' })
          .max(20, { message: 'Name cannot exceed 20 characters' })
          .regex(/^[a-zA-Z0-9\s]+$/, {
            message: 'Name must only contain letters, numbers, and spaces',
          })
          .toUpperCase(),
      )
      .refine((names) => names.length > 0, {
        message: 'At least one floor name is required',
      }),
    blockId: z.string({ required_error: 'BlockId is required' }).uuid(),
  })
  .strict();

export class createFloorDto extends createZodDto(createFloorSchema) {}
