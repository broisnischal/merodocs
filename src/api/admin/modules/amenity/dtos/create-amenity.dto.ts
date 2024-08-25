import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export const createAmenitySchema = z
  .object({
    name: z
      .string({ required_error: 'Name is required' })
      .min(3, { message: 'Name must be at least 3 characters long' })
      .max(50, { message: 'Name cannot exceed 50 characters' }),

    location: z
      .string({ required_error: 'Location is required' })
      .min(3, { message: 'Location must be at least 3 characters long' })
      .max(100, { message: 'Location cannot exceed 100 characters' }),

    openTime: z.string().optional(),

    closeTime: z.string().optional(),

    always: z.boolean().optional(),
  })
  .strict({});

export class createAmenityDto extends createZodDto(createAmenitySchema) {}
