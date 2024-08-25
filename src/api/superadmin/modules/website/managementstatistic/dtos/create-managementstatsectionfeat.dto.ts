import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

const createManagementStatFeatureSchema = z
  .object({
    title: z
      .string({ required_error: 'Title is required.' })
      .trim()
      .min(3)
      .max(100),
    description: z
      .string({ required_error: 'Description is required.' })
      .trim()
      .min(3)
      .max(400),
  })
  .strict();

const updateManagementStatFeatureSchema = z
  .object({
    title: z
      .string({ required_error: 'Title is required.' })
      .trim()
      .min(3)
      .max(100)
      .optional(),
    description: z
      .string({ required_error: 'Description is required.' })
      .trim()
      .min(3)
      .max(400)
      .optional(),
  })
  .strict();

export class createManagementStatFeatureDto extends createZodDto(
  createManagementStatFeatureSchema,
) {}

export class updateManagementStatFeatureDto extends createZodDto(
  updateManagementStatFeatureSchema,
) {}
