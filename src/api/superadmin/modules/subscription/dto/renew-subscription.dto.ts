import { PaymentPatternEnum, PaymentTimeEnum } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export const renewSubscriptionSchema = z
  .object({
    price: z.number().min(0, { message: 'Price cannot be negative' }),
    time: z.nativeEnum(PaymentTimeEnum, { required_error: 'Time is required' }),
    pattern: z.nativeEnum(PaymentPatternEnum, {
      required_error: 'Pattern is required',
    }),
    firstPayment: z
      .number()
      .min(0, { message: 'FirstPayment cannot be negative' })
      .optional(),
  })
  .strict()
  .refine(
    (data) => {
      if (data.price !== undefined && data.firstPayment !== undefined) {
        return data.firstPayment <= data.price;
      }
      return true;
    },
    { message: 'First Payment should not exceed price' },
  );

export class renewSubscriptionDto extends createZodDto(
  renewSubscriptionSchema,
) {}
