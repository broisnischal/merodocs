import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export const updateApartmentSchema = z
  .object({
    name: z
      .string()
      .min(5, { message: 'Name must be at least 5 characters long' })
      .max(50, { message: 'Name cannot exceed 50 characters' })
      .regex(/^[a-zA-Z0-9\s-]+$/, {
        message: 'Name must only contain letters, numbers, and spaces',
      })
      .transform((value) => {
        return value.toLowerCase();
      })
      .optional(),

    country: z
      .string()
      .min(2, { message: 'Country must be at least 2 characters long' })
      .max(30, { message: 'Country cannot exceed 30 characters' })
      .optional(),

    province: z
      .string()
      .min(3, { message: 'Province must be at least 3 characters long' })
      .max(30, { message: 'Province cannot exceed 30 characters' })
      .optional(),

    city: z
      .string()
      .min(3, { message: 'City must be at least 3 characters long' })
      .max(30, { message: 'City cannot exceed 30 characters' })
      .regex(/^[a-zA-Z\s-']+$/, {
        message:
          'City must only contain letters, spaces, hyphens or apostrophe',
      })
      .optional(),

    area: z
      .string()
      .min(2, { message: 'Area must be at least 2 characters long' })
      .max(30, { message: 'Area cannot exceed 30 characters' })
      .optional(),

    postalcode: z
      .string()
      .min(5, { message: 'Postal code must be at least 5 characters long' })
      .max(10, { message: 'Postal code cannot exceed 10 characters' })
      .regex(/^(?!00000)\d{5}$/, {
        message: 'Invalid postal code format',
      })
      .optional(),
  })
  .strict();

export class updateApartmentDto extends createZodDto(updateApartmentSchema) {}
