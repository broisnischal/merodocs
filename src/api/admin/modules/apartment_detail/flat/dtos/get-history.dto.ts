import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export const getFlatHistoryQuerySchema = z
  .object({
    userId: z.string({ required_error: 'UserId is required' }).uuid(),
    flatId: z.string({ required_error: 'FlatId is required' }).uuid(),
    type: z
      .enum(['family_members', 'pets', 'vehicles', 'staffs', 'visitors'])
      .default('family_members'),
    visitorType: z
      .enum(['current', 'past', 'mass_entry'])
      .default('current')
      .optional(),
    moveInId: z.string({ required_error: 'MoveInId is required' }).uuid(),
    moveOutId: z
      .string({ required_error: 'MoveOutId is required' })
      .uuid()
      .optional(),
  })
  .strict();

export class getFlatHistoryQueryDto extends createZodDto(
  getFlatHistoryQuerySchema,
) {}
