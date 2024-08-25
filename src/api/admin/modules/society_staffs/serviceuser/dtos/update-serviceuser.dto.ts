import { BloodGroup, UserGenderEnum } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';
import { validateDateOfBirth } from 'src/common/utils/dob.utils';
import { contactSchema } from 'src/common/validator/body.validator';

export const updateServiceUserSchema = z
  .object({
    name: z
      .string()
      .min(6, 'Name must contain at least 6 characters')
      .max(60, 'Name cannot exceed 60 characters')
      .transform((value) => {
        return value.toLowerCase();
      })
      .optional(),
    contact: contactSchema().optional(),
    dob: z
      .string({ required_error: 'Date Of Birth is required' })
      .transform(validateDateOfBirth)
      .optional(),
    gender: z.nativeEnum(UserGenderEnum).optional(),
    bloodgroup: z.nativeEnum(BloodGroup).optional(),
    roleId: z.string().uuid().optional(),
    shiftId: z.string().uuid().optional(),
    passcode: z.string().optional(),
  })
  .strict();

export class updateServiceUserDto extends createZodDto(
  updateServiceUserSchema,
) {}
