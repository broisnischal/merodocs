import { NPCEnum, SocietyEnum } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

const getNPCQuerySchema = z
  .object({
    for: z.nativeEnum(SocietyEnum, { required_error: 'For is required.' }),
    type: z.nativeEnum(NPCEnum, { required_error: 'Type is required.' }),
  })
  .strict();

export class getNPCQueryDto extends createZodDto(getNPCQuerySchema) {}
