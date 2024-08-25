import { PaymentTimeEnum } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export const updateSubscriptionSchema = z
  .object({
    price: z
      .number()
      .min(0, { message: 'Price cannot be negative' })
      .optional(),
    time: z.nativeEnum(PaymentTimeEnum).optional(),
  })
  .strict();

export const updateInstallmentSchema = z
  .object({
    price: z.number().min(0, { message: 'Price cannot be negative' }),
  })
  .strict();

export class updateSubscriptionDto extends createZodDto(
  updateSubscriptionSchema,
) {}

export class updateInstallmentDto extends createZodDto(
  updateInstallmentSchema,
) {}
