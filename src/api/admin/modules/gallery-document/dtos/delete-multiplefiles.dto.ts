import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export const deleteMultipleFilesSchema = z
  .object({
    ids: z.string().transform((value, ctx) => {
      const ids = value.split(',');

      if (ids.length < 1)
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Need at least 1 id',
        });

      return ids;
    }),
  })
  .strict();

export class deleteMultipleFilesDto extends createZodDto(
  deleteMultipleFilesSchema,
) {}
