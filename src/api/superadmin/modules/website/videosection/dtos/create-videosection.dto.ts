import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';
import { VideoEnum } from '@prisma/client';

export const createVideoSectionSchema = z
  .object({
    title: z.string({ required_error: 'Title is required.' }).max(100),
    type: z.nativeEnum(VideoEnum, {
      required_error: 'Please select where you are uploading this video.',
    }),
  })
  .strict({});

export class createVideoSectionDto extends createZodDto(
  createVideoSectionSchema,
) {}
