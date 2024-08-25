import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';
import { stringSchema } from 'src/common/validator/body.validator';

export const createRideTypeSchema = z.object({
  name: stringSchema('name'),
});

export class createRideTypeDto extends createZodDto(createRideTypeSchema) {}
