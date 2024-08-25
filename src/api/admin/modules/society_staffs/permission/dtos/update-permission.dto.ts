import { AccessRightEnum } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export const updatePermissionSchema = z
  .object({
    access: z.nativeEnum(AccessRightEnum, {
      required_error: 'Access is required',
    }),
  })
  .strict();

export class updatePermissionDto extends createZodDto(updatePermissionSchema) {}
