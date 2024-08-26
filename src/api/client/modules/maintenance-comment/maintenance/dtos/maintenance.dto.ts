import { MaintenanceTypeEnum } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export const createMaintenanceSchema = z
  .object({
    type: z.nativeEnum(MaintenanceTypeEnum, {
      required_error: 'Type is required',
    }),
    category: z
      .string({ required_error: 'Category is required' })
      .max(100, { message: 'Category cannot exceed 100 characters' }),
    message: z
      .string({ required_error: 'Message is required' })
      .max(1000, { message: 'Message cannot exceed 1000 characters' }),
  })
  .strict({});

export class createMaintenanceDto extends createZodDto(
  createMaintenanceSchema,
) {}
