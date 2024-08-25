import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export const updatePopupSchema = z
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
      .optional(),
  })
  .strict({});

export class updatePopupDto extends createZodDto(updatePopupSchema) {}
