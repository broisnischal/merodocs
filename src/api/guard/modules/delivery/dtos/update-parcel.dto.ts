import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export const updateParcelSchema = z
  .object({
    clientId: z
      .string({
        required_error: 'Client Id is required',
      })
      .uuid({ message: 'Invalid Client Id' }),
  })
  .strict({});

export class updateParcelDto extends createZodDto(updateParcelSchema) {}
