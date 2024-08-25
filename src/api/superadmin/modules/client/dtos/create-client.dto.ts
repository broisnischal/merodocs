import {
  PackageTypeEnum,
  PaymentPatternEnum,
  PaymentTimeEnum,
  UserGenderEnum,
} from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';
import { validateDateOfBirth } from 'src/common/utils/dob.utils';
import { contactSchema } from 'src/common/validator/body.validator';

export const createClientSchema = z
  .object({
    name: z
      .string({ required_error: 'Name is required' })
      .min(6, 'Name must contain at least 6 characters')
      .max(60, 'Name cannot exceed 60 characters')
      .transform((value) => {
        return value.toLowerCase();
      }),
    email: z
      .string({ required_error: 'Email is required' })
      .email('Invalid email or malicious activities traced...')
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
    password: z
      .string({ required_error: 'Password is required' })
      .refine(
        (value) =>
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
            value,
          ),
        {
          message:
            'Password must contain at least one uppercase letter, one digit and one special characters and have minimum 8 characters',
        },
      ),
    cpassword: z.string({ required_error: 'Confirm Password is required' }),
    apartmentname: z
      .string()
      .min(5, { message: 'Apartment name must be at least 5 characters long' })
      .max(50, { message: 'Apartment name cannot exceed 50 characters' })
      .regex(/^[a-zA-Z0-9\s]+$/, {
        message:
          'Apartment name must only contain letters, numbers, and spaces',
      })
      .transform((value) => {
        return value.toLowerCase();
      }),
    country: z
      .string()
      .min(2, { message: 'Country must be at least 2 characters long' })
      .max(30, { message: 'Country cannot exceed 30 characters' }),
    province: z
      .string()
      .min(3, { message: 'Province must be at least 3 characters long' })
      .max(30, { message: 'Province cannot exceed 30 characters' }),
    city: z
      .string()
      .min(3, { message: 'City must be at least 3 characters long' })
      .max(30, { message: 'City cannot exceed 30 characters' })
      .regex(/^[a-zA-Z\s-']+$/, {
        message:
          'City must only contain letters, spaces, hyphens or apostrophe',
      }),
    area: z
      .string()
      .min(2, { message: 'Area must be at least 2 characters long' })
      .max(30, { message: 'Area cannot exceed 30 characters' }),
    postalcode: z
      .string()
      .min(5, { message: 'Postal code must be at least 5 characters long' })
      .max(10, { message: 'Postal code cannot exceed 10 characters' })
      .regex(/^(?!00000)\d{5}$/, {
        message: 'Invalid postal code format',
      }),
    type: z.nativeEnum(PackageTypeEnum, {
      required_error: 'Package type is required',
    }),
    enddate: z
      .string({ required_error: 'End Date is required' })
      .transform((value, ctx) => {
        const date = new Date(value);

        if (isNaN(date.getTime()))
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Invalid Date',
          });

        return date;
      })
      .optional(),
    price: z
      .number()
      .min(0, { message: 'Price cannot be negative' })
      .optional(),
    time: z.nativeEnum(PaymentTimeEnum).optional(),
    pattern: z.nativeEnum(PaymentPatternEnum).optional(),
    firstPayment: z
      .number()
      .min(0, { message: 'First payment cannot be negative' })
      .optional(),
  })
  .strict()
  .refine(
    (data) => {
      if (data.price !== undefined && data.firstPayment !== undefined) {
        return data.firstPayment <= data.price;
      }
      return true;
    },
    { message: 'First payment should not exceed price' },
  )
  .refine(
    (data) => {
      if (data.password !== data.cpassword) {
        return false;
      }
      return true;
    },
    {
      message: 'Password does not match',
    },
  );

export class createClientDto extends createZodDto(createClientSchema) {}
