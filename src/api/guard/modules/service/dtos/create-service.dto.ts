import { VehicleTypeEnum } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';
import {
  contactSchema,
  stringSchema,
} from 'src/common/validator/body.validator';

export const createServiceSchema = z.object({
  name: stringSchema('name'),
  contact: contactSchema(),
  vehicleType: z.nativeEnum(VehicleTypeEnum).optional(),
  vehicleNo: z.string().optional(),
  flatId: z
    .string({
      required_error: 'FlatId is required',
    })
    .uuid({ message: 'Invalid Flat Id' }),
  serviceTypeId: z
    .string({
      required_error: 'Service Type Id is required',
    })
    .uuid({ message: 'Invalid Service Id' }),
});

export class createServiceDto extends createZodDto(createServiceSchema) {}
