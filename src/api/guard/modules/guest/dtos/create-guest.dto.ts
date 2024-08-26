import { VehicleTypeEnum } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';
import {
  contactSchema,
  stringSchema,
} from 'src/common/validator/body.validator';

export const createGuestSchema = z
  .object({
    name: stringSchema('name'),
    contact: contactSchema(),
    vehicleType: z.nativeEnum(VehicleTypeEnum).optional(),
    vehicleNo: z.string().optional(),
    noOfGuests: z
      .string()
      .transform((val) => Number(val))
      .refine((value) => value !== undefined && value >= 1 && value <= 20, {
        message: 'Number of guests must be between 1 and 20',
      })
      .optional(),
    flatId: z
      .string({
        required_error: 'FlatId is required',
      })
      .uuid(),
    forMultiple: z.boolean().optional(),
    groupId: z.string().optional(),
    group: z
      .string()
      .transform((val) => {
        if (val === 'true') {
          return true;
        } else {
          return false;
        }
      })
      .optional(),
  })
  .strict();

export class createGuestDto extends createZodDto(createGuestSchema) {}
