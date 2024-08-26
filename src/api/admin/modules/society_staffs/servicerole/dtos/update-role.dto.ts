import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export const updateServiceRoleSchema = z
  .object({
    name: z
      .string({
        required_error: 'Name is required',
      })
      .min(4, 'Name must contain at least 4 characters')
      .max(30, 'Name cannot exceed 30 characters')
      .transform((value) => {
        return value.toLowerCase();
      }),
  })
  .strict();

export class updateServiceRoleDto extends createZodDto(
  updateServiceRoleSchema,
) {}
