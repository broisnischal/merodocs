import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';
import { stringSchema } from 'src/common/validator/body.validator';

const rideSchema = z.object({
  providerId: z
    .string({
      required_error: "Provider can't be empty",
    })
    .uuid({
      message: 'Please select the provider',
    }),
  riderName: stringSchema('name').optional(),
  vehicleId: z.string({}).uuid().optional(),
  fromDate: z
    .string({
      required_error: 'From date (fromDate) cannot be empty.',
    })
    .datetime(),
  toDate: z
    .string({
      required_error: 'To date (toDate) cannot be empty.',
    })
    .datetime(),
  totalhour: z
    .string({
      required_error: 'Value cannot be empty.',
    })
    .optional(),

  // description: z.string().optional(),
});

export class CreateRideDto extends createZodDto(rideSchema) {}

const updateSchema = rideSchema.deepPartial();

export class UpdateRideDto extends createZodDto(updateSchema) {}
