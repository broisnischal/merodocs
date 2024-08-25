import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export const addDocumentTypeSchema = z
  .object({
    id: z.array(z.string()).min(1, { message: 'Id must be at least 1.' }),
  })
  .strict({});

export class addDocumentTypeDto extends createZodDto(addDocumentTypeSchema) {}
