import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export const createCommentSchema = z
  .object({
    maintenanceId: z
      .string({ required_error: 'Maintenance Id is required' })
      .uuid(),
    message: z
      .string({ required_error: 'Message is required' })
      .max(1000, { message: 'Message cannot exceed 1000 characters' }),
  })
  .strict({});

export class createCommentDto extends createZodDto(createCommentSchema) {}
