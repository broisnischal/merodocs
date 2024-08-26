import { CheckInOutRequestTypeEnum, VehicleTypeEnum } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { string, z } from 'nestjs-zod/z';

export const createCheckInSchema = z.object({
  type: z.nativeEnum(CheckInOutRequestTypeEnum, {
    required_error: 'Type is required',
  }),
  typeId: z
    .string({ required_error: 'Type is required' })
    .uuid({ message: 'Invalid Type Id' }),
  vehicleType: z
    .nativeEnum(VehicleTypeEnum, {
      required_error: 'Vehicle Type is required',
    })
    .optional(),
  vehicleno: z
    .string({ required_error: 'Vehicle Number is required' })
    .optional(),
  name: string({ required_error: 'Name is required' }),
  contact: string({ required_error: 'Contact is required' }),
});

export class createCheckInDto extends createZodDto(createCheckInSchema) {}
