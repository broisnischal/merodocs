import { BloodGroup, UserGenderEnum } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';
import { validateDateOfBirth } from 'src/common/utils/dob.utils';
import { contactSchema } from 'src/common/validator/body.validator';

export const updateAdminUserSchema = z
  .object({
    name: z
      .string()
      .min(6, 'Name must contain at least 6 characters')
      .max(60, 'Name cannot exceed 60 characters')
      .transform((value) => {
        return value.toLowerCase();
      })
      .optional(),
    roleId: z.string().uuid().optional(),
    shiftId: z.string().uuid().optional(),
    bloodgroup: z.nativeEnum(BloodGroup).optional(),
    email: z
      .string()
      .email('Invalid email or malicious activities traced...')
      .transform((value) => {
        return value.toLowerCase();
      })
      .optional(),
    gender: z.nativeEnum(UserGenderEnum).optional(),
    contact: contactSchema().optional(),
    dob: z.string().transform(validateDateOfBirth).optional(),
  })
  .strict();

export class updateAdminUserDto extends createZodDto(updateAdminUserSchema) {}
