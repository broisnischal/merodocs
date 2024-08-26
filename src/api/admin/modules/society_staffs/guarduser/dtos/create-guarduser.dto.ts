import { BloodGroup, UserGenderEnum } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';
import { validateDateOfBirth } from 'src/common/utils/dob.utils';
import { contactSchema } from 'src/common/validator/body.validator';

export const createGuardUserSchema = z
  .object({
    name: z
      .string({ required_error: 'Name is required' })
      .min(6, 'Name must contain at least 6 characters')
      .max(60, 'Name cannot exceed 60 characters')
      .transform((value) => {
        return value.toLowerCase();
      }),
    username: z.string({ required_error: 'Username is required' }),
    shiftId: z.string({ required_error: 'shiftId is required' }).uuid(),
    surveillanceId: z
      .string({ required_error: 'surveillanceId is required' })
      .uuid(),
    bloodgroup: z.nativeEnum(BloodGroup, {
      required_error: 'Blood group is required',
    }),
    email: z
      .string({ required_error: 'Email is required' })
      .email('Invalid email or malicious activities traced...')
      .transform((value) => {
        return value.toLowerCase();
      })
      .optional(),
    gender: z.nativeEnum(UserGenderEnum, {
      required_error: 'Gender is required',
    }),
    contact: contactSchema().optional(),
    dob: z
      .string({ required_error: 'Date Of Birth is required' })
      .transform(validateDateOfBirth),
    passcode: z.string({ required_error: 'Passcode is required' }),
  })
  .strict();

export class createGuardUserDto extends createZodDto(createGuardUserSchema) {}
