import { AccessRightEnum } from '@prisma/client';
import { RoutePermissionCollection } from 'src/api/admin/common/enums/route-permission.enum';
import { z } from 'nestjs-zod/z';
import { createZodDto } from 'nestjs-zod';

export const createPermissionSchema = z
  .object({
    name: z
      .string({ required_error: 'Name is required' })
      .refine((value) => RoutePermissionCollection.includes(value), {
        message: 'Invalid Permission Name',
      }),
    roleId: z.string({ required_error: 'Role is required' }).uuid(),
    access: z.nativeEnum(AccessRightEnum, {
      required_error: 'Access is required',
    }),
  })
  .strict();

export class createPermissionDto extends createZodDto(createPermissionSchema) {}
