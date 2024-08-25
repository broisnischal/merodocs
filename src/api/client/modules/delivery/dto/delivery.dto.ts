import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

const deliverySchema = z.object({
  providerId: z
    .string({
      required_error: "Provider can't be empty",
    })
    .uuid({
      message: 'Please select the provider',
    }),
  riderName: z.string({}).optional(),
  vehicleId: z.string({}).uuid().optional(),
  leaveAtGate: z.boolean().default(false).optional(),
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
});

export class CreateDeliveryDto extends createZodDto(deliverySchema) {}

const updateSchema = deliverySchema.deepPartial();

export class UpdateDeliveryDto extends createZodDto(updateSchema) {}
