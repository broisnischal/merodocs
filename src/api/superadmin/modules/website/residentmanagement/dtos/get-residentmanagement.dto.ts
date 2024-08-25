import { ManagementPlatformTypeEnum } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

const getResidentManagementQuerySchema = z
  .object({
    type: z.nativeEnum(ManagementPlatformTypeEnum, {
      required_error: 'Type is required.',
    }),
  })
  .strict();

export class getResidentManagementQueryDto extends createZodDto(
  getResidentManagementQuerySchema,
) {}
