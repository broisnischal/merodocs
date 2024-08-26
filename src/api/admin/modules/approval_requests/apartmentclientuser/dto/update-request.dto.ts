import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

const updateRequestSchema = z.object({
  status: z
    .enum(['approved', 'rejected'], {
      required_error: 'Status is required',
    })
    .refine((value) => {
      return value === 'approved' || value === 'rejected';
    }, "Status can only be 'approved' or 'rejected'"),
  message: z
    .string()
    // .length(200, 'Message cannot exceed 200 characters')
    .optional(),
});

export class updateRequestDto extends createZodDto(updateRequestSchema) {}
