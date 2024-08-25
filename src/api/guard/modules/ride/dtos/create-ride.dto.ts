import { VehicleTypeEnum } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';
import {
  contactSchema,
  stringSchema,
} from 'src/common/validator/body.validator';

export const createRideSchema = z.object({
  name: stringSchema('name'),
  contact: contactSchema(),
  vehicleType: z.nativeEnum(VehicleTypeEnum).optional(),
  vehicleNo: z.string().optional(),
  flatId: z
    .string({
      required_error: 'FlatId is required',
    })
    .uuid({ message: 'Invalid Flat Id' }),
  serviceProviderId: z
    .string({
      required_error: 'Provider Id is required',
    })
    .uuid({ message: 'Invalid Provider Id' }),
});

export class createRideDto extends createZodDto(createRideSchema) {}
