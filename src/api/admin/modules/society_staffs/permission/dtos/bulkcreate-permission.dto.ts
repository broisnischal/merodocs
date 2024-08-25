import { AccessRightEnum } from '@prisma/client';
import { RoutePermissionCollection } from 'src/api/admin/common/enums/route-permission.enum';
import { z } from 'nestjs-zod/z';
import { createZodDto } from 'nestjs-zod';

export const bulkCreatePermissionSchema = z
  .object({
    permissions: z
      .object({
        name: z
          .string({
            required_error: 'Name is required',
          })
          .refine(
            (value) => RoutePermissionCollection.includes(value),
            'Invalid Permission Name',
          ),
        access: z.nativeEnum(AccessRightEnum, {
          required_error: 'Access is required',
        }),
      })
      .array()
      .min(1, 'No permissions sent'),
    roleId: z
      .string({ required_error: 'RoleId is required' })
      .uuid('RoleId is invalid'),
  })
  .strict();

export class bulkCreatePermissionDto extends createZodDto(
  bulkCreatePermissionSchema,
) {}
