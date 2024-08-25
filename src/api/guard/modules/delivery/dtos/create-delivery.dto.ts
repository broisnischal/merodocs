import { VehicleTypeEnum } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';
import {
  contactSchema,
  stringSchema,
} from 'src/common/validator/body.validator';

export const createDeliverySchema = z.object({
  name: stringSchema('name'),
  contact: contactSchema(),
  vehicleType: z.nativeEnum(VehicleTypeEnum).optional(),
  vehicleNo: z.string().optional(),
  flats: z
    .string({
      required_error: 'FlatId is required',
    })
    .transform((val, ctx) => {
      if (!val)
        ctx.addIssue({
          code: 'custom',
          message: 'Flat Ids is required',
          path: ['flats'],
        });
      const values = val.trim().split(',');

      values.map((value) => {
        const x = z.string().uuid().safeParse(value);

        if (!x.success) {
          ctx.addIssue({
            code: 'custom',
            message: 'Invalid Flat Id',
            path: ['flats'],
          });
        }
      });

      return values;
    }),
  serviceProviderId: z
    .string({
      required_error: 'Provider Id is required',
    })
    .uuid({ message: 'Invalid Provider Id' }),
});

export class createDeliveryDto extends createZodDto(createDeliverySchema) {}
