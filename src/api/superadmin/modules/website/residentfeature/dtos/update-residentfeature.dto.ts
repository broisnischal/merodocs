import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export const updateResidentFeatureSchema = z
  .object({
    title: z.string().trim().min(3).max(100).toLowerCase().optional(),
    description: z.string().trim().min(3).max(250).optional(),
  })
  .strict({});

export class updateResidentFeatureDto extends createZodDto(
  updateResidentFeatureSchema,
) {}
