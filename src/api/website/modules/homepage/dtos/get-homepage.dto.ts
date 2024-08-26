import { HomeEnum } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

const getHomePageQuerySchema = z
  .object({
    type: z.nativeEnum(HomeEnum, {
      required_error: 'Type is required.',
    }),
  })
  .strict();

export class getHomePageQueryDto extends createZodDto(getHomePageQuerySchema) {}
