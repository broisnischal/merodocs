import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export const checkFlatSchema = z
  .object({
    name: z
      .string({ required_error: 'Floor is required' })
      .min(3, { message: 'Name must be at least 3 characters long' })
      .max(20, { message: 'Name cannot exceed 20 characters' })
      .regex(/^[a-zA-Z0-9\s]+$/, {
        message: 'Name must only contain letters, numbers, and spaces',
      })
      .transform((value) => {
        return value.toLowerCase();
      }),
    floorId: z.string({ required_error: 'FloorId is required' }).uuid(),
  })
  .strict();

export class checkFlatDto extends createZodDto(checkFlatSchema) {}
