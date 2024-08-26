import { FAQTypeEnum } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export const createFAQSchema = z
  .object({
    for: z.nativeEnum(FAQTypeEnum, { required_error: 'FAQ for is required' }),
    question: z
      .string({ required_error: 'Question is required' })
      .trim()
      .min(3)
      .max(100),
    answer: z
      .string({ required_error: 'Answer is required' })
      .trim()
      .min(3)
      .max(300),
  })
  .strict({});

export class createFAQDto extends createZodDto(createFAQSchema) {}
