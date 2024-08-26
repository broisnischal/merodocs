import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';
import { stringSchema } from 'src/common/validator/body.validator';

export const createServiceTypeSchema = z.object({
  name: stringSchema('name'),
});

export class createServiceTypeDto extends createZodDto(
  createServiceTypeSchema,
) {}
