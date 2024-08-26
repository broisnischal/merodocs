import { BloodGroup, ClientStaffStatus, UserGenderEnum } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';
import { validateDateOfBirth } from 'src/common/utils/dob.utils';
import { contactSchema } from 'src/common/validator/body.validator';

export const createClientStaffSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .min(6, 'Name must contain at least 6 characters')
    .max(60, 'Name cannot exceed 60 characters'),
  contact: contactSchema(),
  econtact: z
    .string({ required_error: 'Emergency contact is required' })
    .refine((value) => /^[0-9]{10}$/.test(value), {
      message: 'Invalid emergency Contact Number',
    })
    .optional(),
  bloodgroup: z
    .nativeEnum(BloodGroup, {
      required_error: 'Blood group is required',
    })
    .optional(),
  gender: z.nativeEnum(UserGenderEnum, {
    required_error: 'Gender is required',
  }),
  dob: z
    .string({ required_error: 'Date Of Birth is required' })
    .transform(validateDateOfBirth)
    .optional(),
  staffRoleId: z.string({ required_error: 'Staff role is required' }).uuid(),
  citizenshipNo: z
    .string({
      required_error: 'Citizenship number is required',
    })
    .refine(
      (value) => {
        const cleanValue = value.replace(/-/g, '');
        return /^\d+$/.test(cleanValue);
      },
      {
        message: 'Citizenship number can only contain numbers.',
      },
    )
    .transform((val) => val.replace(/-/g, '')),
  // profile: z.string({ required_error: 'Profile is required' }),
});
// .strict();

const updateSchema = createClientStaffSchema.deepPartial();

export class createClientStaffDto extends createZodDto(
  createClientStaffSchema,
) {}

export class updateClientStaffDto extends createZodDto(updateSchema) {}

const staffQueryDTO = z.object({
  q: z
    .string({})
    .refine(
      (value) => {
        const cleanValue = value.replace(/-/g, '');
        return /^\d+$/.test(cleanValue);
      },
      {
        message: 'Citizenship number can only contain numbers.',
      },
    )
    .transform((val) => val.replace(/-/g, ''))
    .optional(),
  status: z.nativeEnum(ClientStaffStatus).optional(),
});

export class StaffQueryDto extends createZodDto(staffQueryDTO) {}
