import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export const expireSubscriptionSchema = z
  .object({
    reason: z
      .string()
      .min(3, { message: 'Reason must be atleast three character long' }),
  })
  .strict();

export class expireSubscriptionDto extends createZodDto(
  expireSubscriptionSchema,
) {}
