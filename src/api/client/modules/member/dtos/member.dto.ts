import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';
import {
  contactSchema,
  stringSchema,
} from 'src/common/validator/body.validator';

export const createMemberOnlineSchema = z
  .object({
    contact: contactSchema(),
    name: stringSchema('name'),
    email: z
      .string()
      .email('Invalid Email Format')
      .transform((value) => {
        return value.toLowerCase();
      })
      .optional(),
  })
  .strict();

export const createMemberOfflineSchema = z
  .object({
    name: stringSchema('name'),
    contact: contactSchema().optional(),
    email: z
      .string()
      .email('Invalid Email Format')
      .transform((value) => {
        return value.toLowerCase();
      })
      .optional(),
    image: z.any().optional(),
  })
  .strict();

export const verifyMemberOnlineSchema = z
  .object({
    phone: z
      .string({
        required_error: "Phone can't be empty",
      })
      .refine((value) => /^[0-9]{10}$/.test(value), {
        message: 'Invalid Contact Number',
      }),
    otp: z
      .string({
        required_error: "Otp can't be empty",
      })
      .min(6, {
        message: 'Otp must be 6 characters long',
      })
      .max(6, {
        message: 'Otp must be 6 characters long',
      }),
    hash: z.string({
      required_error: "Hash can't be empty",
    }),
  })
  .strict();

export class createMemberOnlineDto extends createZodDto(
  createMemberOnlineSchema,
) {}

export class createMemberOfflineDto extends createZodDto(
  createMemberOfflineSchema,
) {}

export class verifyMemberOnlineDto extends createZodDto(
  verifyMemberOnlineSchema,
) {}

export class updateMemberOfflineDto extends createZodDto(
  createMemberOfflineSchema.deepPartial(),
) {}
