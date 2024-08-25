import { HomeEnum } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

const getWhyUsSectionQuerySchema = z
  .object({
    type: z.nativeEnum(HomeEnum, {
      required_error: 'Type is required.',
    }),
  })
  .strict();

export class getWhyUsSectionQueryDto extends createZodDto(
  getWhyUsSectionQuerySchema,
) {}
