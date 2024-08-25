import { AccessRightEnum } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';
import {
  superAdminPermissions,
  superadminPermissionNames,
} from 'src/api/superadmin/common/constants/route-permissions';

export const updateRoleSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .min(3)
    .max(50)
    .transform((value) => {
      return value.toLowerCase();
    })
    .optional(),
  permissions: z
    .object(
      {
        name: z
          .string({ required_error: 'Name is required' })
          .refine(
            (value) => superadminPermissionNames.includes(value),
            'Invalid permission names',
          ),
        access: z.nativeEnum(AccessRightEnum, {
          required_error: 'Access is required',
        }),
        children: z
          .string({ required_error: 'Children Component is required' })
          .array(),
      },
      { required_error: 'Permissions is required' },
    )
    .refine((data) => {
      const values = superAdminPermissions[data.name] as string[];

      if (values) {
        const truce = data.children.every((value) => values.includes(value));

        return truce;
      }
    }, 'Invalid children components access for permission')
    .array()
    .min(1),
});

export class UpdateRoleDto extends createZodDto(updateRoleSchema) {}
