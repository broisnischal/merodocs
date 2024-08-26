import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';
import { stringSchema } from 'src/common/validator/body.validator';

export const createVehicleSchema = z.object({
  name: stringSchema('name'),
});

export class createVechileDto extends createZodDto(createVehicleSchema) {}
