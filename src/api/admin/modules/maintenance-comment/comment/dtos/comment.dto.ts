import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export const createCommentSchema = z
  .object({
    maintenanceId: z
      .string({ required_error: 'Maintenance Id is required' })
      .uuid(),
    message: z
      .string()
      .max(1000, { message: 'Message cannot exceed 1000 characters' })
      .optional(),
  })
  .strict({});

export class createCommentDto extends createZodDto(createCommentSchema) {}
