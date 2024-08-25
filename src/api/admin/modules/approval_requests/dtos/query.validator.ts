import { ApartmentClientUserStatusEnum } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

const querySchema = z.object({
  page: z
    .string()
    .transform((val, ctx) => {
      if (!/^[0-9]+$/.test(val)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Page: Not a number',
        });
      }

      return parseInt(val);
    })
    .default('1'),
  limit: z
    .string()
    .transform((val, ctx) => {
      if (!/^[0-9]+$/.test(val)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Limit: Not a number',
        });
      }

      return parseInt(val);
    })
    .default('10'),

  status: z
    .nativeEnum(ApartmentClientUserStatusEnum)
    .default(ApartmentClientUserStatusEnum.pending),

  type: z.enum(['account', 'flat']).default('account'),
});

export class ApartmentRequestDto extends createZodDto(querySchema) {}
