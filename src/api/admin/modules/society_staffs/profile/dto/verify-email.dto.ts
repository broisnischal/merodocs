import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export const verifyEmailUpdate = z
  .object({
    token: z.string({ required_error: 'Token is required' }),
    id: z.string({ required_error: 'Id is required' }).uuid('Invalid Id'),
  })
  .strict();

export class verifyEmailUpdateDto extends createZodDto(verifyEmailUpdate) {}
