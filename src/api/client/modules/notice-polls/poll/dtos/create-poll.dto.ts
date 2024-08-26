import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export const createPollSchema = z
  .object({
    pollAnswerId: z
      .string({ required_error: 'Poll answer id is required' })
      .uuid(),
  })
  .strict({});

export class createPollDto extends createZodDto(createPollSchema) {}
