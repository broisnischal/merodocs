import { VehicleTypeEnum } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';
import { stringSchema } from 'src/common/validator/body.validator';

const vehicleSchema = z
  .object({
    noplate: z
      .string({ required_error: 'Vehicle number is required' })
      .min(1, 'Vehicle number is required'),
    type: z.nativeEnum(VehicleTypeEnum, {
      required_error: 'Vehicle type is required',
    }),
    name: stringSchema('name'),
  })
  .strict();

export class CreateVehicleDto extends createZodDto(vehicleSchema) {}

export class UpdateVehicleDto extends createZodDto(
  vehicleSchema.deepPartial(),
) {}
