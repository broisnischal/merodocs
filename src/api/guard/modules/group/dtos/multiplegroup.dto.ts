import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export const createMultipleGroupSchema = z.object({
  ids: z
    .array(z.string().uuid(), {
      required_error: 'Ids is required',
      invalid_type_error: 'Ids must be an array of strings',
    })
    .refine((ids) => ids.length > 0, {
      message: 'At least one ID must be provided',
    }),
});

export class createMultipleGroupDto extends createZodDto(
  createMultipleGroupSchema,
) {}
