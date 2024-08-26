import { BloodGroup, UserGenderEnum } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';
import { validateDateOfBirth } from 'src/common/utils/dob.utils';
import { contactSchema } from 'src/common/validator/body.validator';

export const createServiceUserSchema = z
  .object({
    name: z
      .string({ required_error: 'Name is required' })
      .min(6, 'Name must contain at least 6 characters')
      .max(60, 'Name cannot exceed 60 characters')
      .transform((value) => {
        return value.toLowerCase();
      }),
    contact: contactSchema(),
    dob: z
      .string({ required_error: 'Date Of Birth is required' })
      .transform(validateDateOfBirth),
    gender: z.nativeEnum(UserGenderEnum, {
      required_error: 'Gender is required',
    }),
    bloodgroup: z.nativeEnum(BloodGroup, {
      required_error: 'Blood group is required',
    }),
    roleId: z.string({ required_error: 'Role is required' }).uuid(),
    shiftId: z.string({ required_error: 'Shift is required' }).uuid(),
    passcode: z.string({ required_error: 'Passcode is required' }),
  })
  .strict();

export class createServiceUserDto extends createZodDto(
  createServiceUserSchema,
) {}
