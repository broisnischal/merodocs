import { FolderAccessEnum } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export const updateFolderSchema = z
  .object({
    name: z
      .string()
      .min(4, 'Name must contain at least 4 characters')
      .max(30, 'Name cannot exceed 30 characters')
      .transform((value) => {
        return value.toLowerCase();
      })
      .optional(),
    access: z.nativeEnum(FolderAccessEnum).optional(),
  })
  .strict();

export class updateFolderDto extends createZodDto(updateFolderSchema) {}
