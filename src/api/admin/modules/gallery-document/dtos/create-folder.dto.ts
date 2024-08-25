import { FolderAccessEnum } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export const createFolderSchema = z
  .object({
    name: z
      .string({
        required_error: 'Name is required',
      })
      .min(4, 'Name must contain at least 4 characters')
      .max(30, 'Name cannot exceed 30 characters')
      .transform((value) => {
        return value.toLowerCase();
      }),
    access: z
      .nativeEnum(FolderAccessEnum, { required_error: 'Access is required' })
      .default(FolderAccessEnum.public),
  })
  .strict();

export class createFolderDto extends createZodDto(createFolderSchema) {}
