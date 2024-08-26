import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';
import { VideoEnum } from '@prisma/client';

export const getVideoSectionSchema = z
  .object({
    type: z.nativeEnum(VideoEnum, {
      required_error: 'Please select where you are viewing this video.',
    }),
  })
  .strict({});

export class getVideoSectionDto extends createZodDto(getVideoSectionSchema) {}
