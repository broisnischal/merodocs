import { LegalComplianceTypeEnum } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

const getLegalComplianceSchema = z
  .object({
    type: z.nativeEnum(LegalComplianceTypeEnum, {
      required_error: 'Type is required.',
    }),
  })
  .strict();

export class getLegalComplianceDto extends createZodDto(
  getLegalComplianceSchema,
) {}
