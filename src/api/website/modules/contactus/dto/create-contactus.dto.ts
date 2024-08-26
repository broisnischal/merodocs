import { ContactUsRoleEnum } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export const contactUsSchema = z
  .object({
    fullName: z
      .string({ required_error: 'Name is required' })
      .min(5, { message: 'Name must be at least 5 characters long' })
      .max(50, { message: 'Name cannot exceed 50 characters' })
      .regex(/^[a-zA-Z\s]+$/, {
        message: 'Name must only contain letters, numbers, and spaces',
      }),
    email: z
      .string({ required_error: 'Email is required' })
      .email({ message: 'Email must be a valid email address' })
      .max(100, { message: 'Email cannot exceed 100 characters' }),
    number: z
      .string({ required_error: 'Phone number is required' })
      .min(10, { message: 'Phone number must be at least 10 characters long' })
      .max(15, { message: 'Phone number cannot exceed 15 characters' })
      .regex(/^[0-9]+$/, {
        message: 'Phone number must only contain numbers',
      }),
    societyName: z
      .string({ required_error: 'Society name is required' })
      .min(3, { message: 'Society name must be at least 3 characters long' })
      .max(100, { message: 'Society name cannot exceed 100 characters' }),
    message: z
      .string({ required_error: 'Message is required' })
      .min(10, { message: 'Message must be at least 10 characters long' })
      .max(1000, { message: 'Message cannot exceed 1000 characters' }),
    role: z.nativeEnum(ContactUsRoleEnum, {
      required_error: 'Role is required',
    }),
  })
  .strict();

export class createContactUsDto extends createZodDto(contactUsSchema) {}
