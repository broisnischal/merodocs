import { CheckInOutStatusEnum } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

const checkInUpdateSchema = z
  .object({
    status: z.enum(
      [
        CheckInOutStatusEnum.approved,
        CheckInOutStatusEnum.rejected,
        CheckInOutStatusEnum.noresponse,
      ],
      {
        required_error: 'Status is required',
      },
    ),
  })
  .strict();

export class UpdateCheckInDto extends createZodDto(checkInUpdateSchema) {}
