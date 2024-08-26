import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';
import {
  contactSchema,
  stringSchema,
} from 'src/common/validator/body.validator';

export const vehicleEntrySchema = z.object({
  vehicleId: z.string({ required_error: 'Vehicle Type Id is required' }).uuid(),
  name: stringSchema('name'),
  contact: contactSchema(),
  vehicleNo: z.string().optional(),
  isFrequent: z.string().transform((val) => val === 'true'),
});

export class vehicleEntryDto extends createZodDto(vehicleEntrySchema) {}
