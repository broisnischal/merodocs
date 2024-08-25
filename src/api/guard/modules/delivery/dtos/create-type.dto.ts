import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';
import { stringSchema } from 'src/common/validator/body.validator';

export const createDeliveryTypeSchema = z.object({
  name: stringSchema('name'),
});

export class createDeliveryTypeDto extends createZodDto(
  createDeliveryTypeSchema,
) {}
