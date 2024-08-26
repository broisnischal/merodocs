import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export const createNoticeSchema = z
  .object({
    title: z
      .string({ required_error: 'Title is required' })
      .min(3, { message: 'Title must be at least 3 characters long' })
      .max(40, { message: 'Title cannot exceed 40 characters' }),

    category: z
      .string({ required_error: 'Category is required' })
      .min(3, { message: 'Category must be at least 3 characters long' })
      .max(30, { message: 'Category cannot exceed 30 characters' }),

    message: z
      .string({ required_error: 'Message is required' })
      .min(3, { message: 'Message must be at least 3 characters long' })
      .max(5000, { message: 'Message cannot exceed 5000 characters' }),
  })
  .strict({});

export class createNoticeDto extends createZodDto(createNoticeSchema) {}
