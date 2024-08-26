import { FolderTypeEnum } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

const paramSchema = z.object({
  type: z.nativeEnum(FolderTypeEnum),
});

export class documentGalleryDto extends createZodDto(paramSchema) {}
//
