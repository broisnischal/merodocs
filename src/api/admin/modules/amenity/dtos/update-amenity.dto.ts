import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export const updateAmenitySchema = z
  .object({
    name: z
      .string()
      .min(3, { message: 'Name must be at least 3 characters long' })
      .max(50, { message: 'Name cannot exceed 50 characters' })
      .optional(),

    location: z
      .string()
      .min(3, { message: 'Location must be at least 3 characters long' })
      .max(100, { message: 'Location cannot exceed 100 characters' })
      .optional(),

    openTime: z.string().optional(),

    closeTime: z.string().optional(),

    always: z.boolean().optional(),
  })
  .strict({});

export class updateAmenityDto extends createZodDto(updateAmenitySchema) {}
