import { ContactUsStatusEnum } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export const updateContactUsSchema = z
  .object({
    status: z.nativeEnum(ContactUsStatusEnum, {
      required_error: 'Status is required',
    }),
  })
  .strict({});

export class updateContactUsDto extends createZodDto(updateContactUsSchema) {}
