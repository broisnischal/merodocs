import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export const updateDocumentTypeSchema = z
  .object({
    name: z
      .string({ required_error: 'Name is required' })
      .min(3, { message: 'Name must be at least 3 characters long' })
      .max(50, { message: 'Name cannot exceed 50 characters' })
      .optional(),
    atSignUp: z.boolean().optional(),
  })
  .strict({});

export class updateDocumentTypeDto extends createZodDto(
  updateDocumentTypeSchema,
) {}

export const updateMoveOutDocumentSchema = z
  .object({
    moveOut: z.boolean().optional(),
  })
  .strict({});

export class updateMoveOutDocumentDto extends createZodDto(
  updateMoveOutDocumentSchema,
) {}

export const updateMultipleDocumentTypeSchema = z
  .object({
    ids: z
      .array(z.string(), { required_error: 'Ids is required' })
      .min(1, { message: 'At least one document  is required' }),
  })
  .strict({});

export class updateMultipleDocumentTypeDto extends createZodDto(
  updateMultipleDocumentTypeSchema,
) {}
