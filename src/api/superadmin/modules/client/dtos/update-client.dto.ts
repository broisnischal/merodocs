import { UserGenderEnum } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';
import { validateDateOfBirth } from 'src/common/utils/dob.utils';
import {
  contactSchema,
  stringSchema,
} from 'src/common/validator/body.validator';

export const updateClientSchema = z
  .object({
    name: stringSchema('name').optional(),
    contact: contactSchema().optional(),
    dob: z.string().transform(validateDateOfBirth).optional(),
    gender: z.nativeEnum(UserGenderEnum).optional(),
  })
  .strict();

export class updateClientDto extends createZodDto(updateClientSchema) {}
