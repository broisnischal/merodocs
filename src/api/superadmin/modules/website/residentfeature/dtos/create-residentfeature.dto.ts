import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export const createHomeFeatureSchema = z
  .object({
    title: z
      .string({ required_error: 'Title is required' })
      .trim()
      .min(3)
      .max(100)
      .toLowerCase(),

    description: z
      .string({ required_error: 'Description is required' })
      .trim()
      .min(3)
      .max(250),
  })
  .strict({});

export class createResidentFeatureDto extends createZodDto(
  createHomeFeatureSchema,
) {}
