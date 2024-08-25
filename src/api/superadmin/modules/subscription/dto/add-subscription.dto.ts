import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export const addSubscriptionSchema = z
  .object({
    price: z.number().min(0, { message: 'Price cannot be negative' }),
  })
  .strict();

export class addSubscriptionDto extends createZodDto(addSubscriptionSchema) {}
