import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

const createNPCFeatureSchema = z
  .object({
    description: z
      .string({ required_error: 'Description is required.' })
      .trim()
      .min(3)
      .max(400),
    sectionId: z.string({ required_error: 'SectionId is required' }).uuid(),
  })
  .strict();

const updateNPCFeatureSchema = z
  .object({
    description: z
      .string({ required_error: 'Description is required.' })
      .trim()
      .min(3)
      .max(400),
  })
  .strict();

export class createNPCFeatureDto extends createZodDto(createNPCFeatureSchema) {}

export class updateNPCFeatureDto extends createZodDto(updateNPCFeatureSchema) {}
