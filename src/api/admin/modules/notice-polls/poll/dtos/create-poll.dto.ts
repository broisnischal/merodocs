import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export const createPollSchema = z
  .object({
    title: z
      .string({ required_error: 'Title is required' })
      .min(3, { message: 'Title must be at least 3 characters long' })
      .max(250, { message: 'Title cannot exceed 250 characters' }),
    countVisible: z.boolean({
      required_error: 'Count visibility is required',
    }),
    endAt: z.string({
      required_error: 'End At is required',
    }),
    choices: z
      .array(
        z
          .string()
          .min(2, { message: 'Choices must be at least 2 characters long' })
          .max(250, { message: 'Choices cannot exceed 250 characters' })
          .transform((value) => {
            return value.toLowerCase();
          }),
      )
      .min(2, { message: 'Choices must be at least 2.' })
      .max(4, { message: 'Choices must not exceed 4.' }),
  })
  .strict({});

export class createPollDto extends createZodDto(createPollSchema) {}
