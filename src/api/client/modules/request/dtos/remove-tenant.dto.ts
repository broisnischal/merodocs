import moment from 'moment';
import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

const removeTenantSchema = z
  .object({
    moveOut: z.string().transform((val, ctx) => {
      const date = moment(val, 'YYYY-MM-DD', true);

      if (!date.isValid()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Invalid date format',
          path: ['moveOut'],
        });
      }

      if (date.isBefore(moment().startOf('day'))) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Move out date should be greater than or equal to today',
          path: ['moveOut'],
        });
      }

      return date.toDate();
    }),
  })
  .strict();

export class removeTenantDto extends createZodDto(removeTenantSchema) {}
