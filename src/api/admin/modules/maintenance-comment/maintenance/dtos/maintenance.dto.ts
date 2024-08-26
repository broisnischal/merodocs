import { MaintenanceStatus } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export const updateMaintenanceSchema = z
  .object({
    status: z.nativeEnum(MaintenanceStatus, {
      required_error: 'Status is required',
    }),
  })
  .strict({});

export class updateMaintenanceDto extends createZodDto(
  updateMaintenanceSchema,
) {}
