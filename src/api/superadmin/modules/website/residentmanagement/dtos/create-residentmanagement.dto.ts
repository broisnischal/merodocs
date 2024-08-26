import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';
import { ManagementPlatformTypeEnum } from '@prisma/client';

export const createResidentManagementSectionSchema = z
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
    type: z.nativeEnum(ManagementPlatformTypeEnum, {
      required_error: 'Type is required.',
    }),
  })
  .strict();

export class createResidentManagementSectionDto extends createZodDto(
  createResidentManagementSectionSchema,
) {}
