import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';
import { stringSchema } from 'src/common/validator/body.validator';

const surveillanceSchema = z.object({
  name: stringSchema('name').toUpperCase(),
  apartmentId: z.string().uuid().optional(),
  guardId: z.array(z.string().uuid()).optional(),
});

export class createSurveillanceDto extends createZodDto(surveillanceSchema) {}

const updateSchema = surveillanceSchema.deepPartial();

export class updateSurveillanceDto extends createZodDto(updateSchema) {}
