import { ProblemStatus } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export const updateProblemSchema = z
  .object({
    status: z.nativeEnum(ProblemStatus, {
      required_error: 'Status is required',
    }),
  })
  .strict({});

export class updateProblemDto extends createZodDto(updateProblemSchema) {}
