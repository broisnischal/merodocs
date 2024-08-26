import { BloodGroup, ClientUserType, UserGenderEnum } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';
import { contactSchema } from 'src/common/validator/body.validator';

const userSchema = z.object({
  // id: z.string(),
  contact: contactSchema(),
  name: z
    .string({
      required_error: 'Name is required',
    })
    .toLowerCase()
    .optional(),
  email: z
    .string({
      required_error: 'Email is required',
    })
    .email()
    .optional(),
  apartmentId: z.string({}).optional(),
  flatId: z
    .string({
      required_error: 'Flat Id is required',
    })
    .optional(),
  bloodgroup: z
    .nativeEnum(BloodGroup, {
      required_error: 'Blood group is required',
    })
    .optional(),

  type: z
    .enum([ClientUserType.owner, ClientUserType.tenant], {
      required_error: 'Type is required',
    })
    .optional(),
  gender: z
    .nativeEnum(UserGenderEnum, {
      required_error: 'Gender is required',
    })
    .optional(),
  residing: z.boolean().optional(),
  family: z.boolean().optional(),
  archive: z.boolean().optional(),
  dob: z
    .string()
    .refine((value) => !isNaN(new Date(value).getTime()), {
      message: 'Invalid Date',
    })
    .transform((value) => transformToISO(value)),
});

const transformToISO = (value: string): string => {
  const date = new Date(value);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return new Date(date.toISOString().split('T')[0]).toISOString();
};

const updateSchema = userSchema.deepPartial();

const offlineUserSchema = userSchema
  .omit({
    gender: true,
    residing: true,
    family: true,
    apartmentId: true,
    archive: true,
  })
  .required()
  .merge(
    z.object({
      move_in: z
        .string({
          required_error: "Move in can't be empty",
        })
        .datetime({
          message: 'Invalid Date',
        }),
      image: z.any().optional(),
    }),
  );

export class UpdateClientUserDto extends createZodDto(updateSchema) {}
export class CreateOfflineUserDto extends createZodDto(offlineUserSchema) {}
// export type SectionType = Prettify<(typeof sectionSchema)["_output"]["body"]>;
