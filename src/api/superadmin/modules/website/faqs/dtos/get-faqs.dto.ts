import { FAQTypeEnum } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

const getFaqsSchema = z.object({
  for: z.nativeEnum(FAQTypeEnum, { required_error: 'For type is required.' }),
});

export class getFAQsDto extends createZodDto(getFaqsSchema) {}
