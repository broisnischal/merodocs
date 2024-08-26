import { LegalComplianceTypeEnum } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export const createLegalComplianceSchema = z
  .object({
    type: z.nativeEnum(LegalComplianceTypeEnum, {
      required_error: 'Type is required.',
    }),
    content: z.string({ required_error: 'Content is required' }),
  })
  .strict();

export class createLegalComplianceDto extends createZodDto(
  createLegalComplianceSchema,
) {}
