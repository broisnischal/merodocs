import { PetTypesEnum, UserGenderEnum } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';
import { stringSchema } from 'src/common/validator/body.validator';

const petSchema = z
  .object({
    type: z.nativeEnum(PetTypesEnum, {
      required_error: 'Pet type is required',
    }),
    name: stringSchema('name'),
    image: z.any().optional(),
    gender: z.nativeEnum(UserGenderEnum, {
      required_error: 'Gender is required',
    }),
    breed: z.string({
      required_error: 'Breed is required',
    }),
    age: z
      .string()
      .min(1, {
        message: 'Age must be at least 1 year',
      })
      .transform((value) => {
        const age = value;
        return age;
      }),
  })
  .strict();

export class CreatePetDto extends createZodDto(petSchema) {}

export class UpdatePetDto extends createZodDto(petSchema.deepPartial()) {}
