import { EmergencyAlertType } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

const alertSchema = z
  .object({
    type: z.nativeEnum(EmergencyAlertType, {
      required_error: 'Alert type is required',
    }),
  })
  .strict();

export class CreateAlertDto extends createZodDto(alertSchema) {}
