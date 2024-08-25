import { CheckInOutStatusEnum } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

const checkInUpdateSchema = z
  .object({
    status: z.enum(
      [CheckInOutStatusEnum.approved, CheckInOutStatusEnum.rejected],
      {
        required_error: 'Status is required',
      },
    ),
    leaveAtGate: z.boolean().optional(),
  })
  .strict();

export class UpdateCheckInDto extends createZodDto(checkInUpdateSchema) {}
