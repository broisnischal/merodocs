import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export const createPopupSchema = z
  .object({
    name: z
      .string()
      .min(2, { message: 'Name must be at least 2 characters long' })
      .max(250, { message: 'Name cannot exceed 250 characters' })
      .optional(),
    link: z
      .string()
      .min(10, { message: 'Link must be at least 10 characters long' })
      .max(2500, { message: 'link cannot exceed 2500 characters' })
      .optional()
      .or(z.literal('')),

    // activated: z.string().transform((val) => Boolean(val)),
  })
  .strict({});

export class createPopupDto extends createZodDto(createPopupSchema) {}
