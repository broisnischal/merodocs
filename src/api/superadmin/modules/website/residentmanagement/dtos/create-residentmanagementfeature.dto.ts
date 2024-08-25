import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

const createResidentManagementFeatureSchema = z
  .object({
    description: z
      .string({ required_error: 'Description is required.' })
      .trim()
      .min(3)
      .max(400),
    sectionId: z.string({ required_error: 'SectionId is required' }).uuid(),
  })
  .strict();

const updateResidentManagementFeatureSchema = z
  .object({
    description: z
      .string({ required_error: 'Description is required.' })
      .trim()
      .min(3)
      .max(400),
  })
  .strict();

export class createResidentManagementFeatureDto extends createZodDto(
  createResidentManagementFeatureSchema,
) {}

export class updateResidentManagementFeatureDto extends createZodDto(
  updateResidentManagementFeatureSchema,
) {}
