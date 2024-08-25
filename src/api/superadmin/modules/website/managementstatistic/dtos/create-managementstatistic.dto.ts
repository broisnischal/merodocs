import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export const createManagementStatisticSectionSchema = z
  .object({
    title: z
      .string({ required_error: 'Title is required.' })
      .trim()
      .min(3)
      .max(100),
    description: z
      .string({
        required_error: 'Description is required.',
      })
      .trim()
      .min(3)
      .max(400),
  })
  .strict();

export class createManagementStatisticSectionDto extends createZodDto(
  createManagementStatisticSectionSchema,
) {}
