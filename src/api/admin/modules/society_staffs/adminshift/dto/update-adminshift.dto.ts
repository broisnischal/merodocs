import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

const timeSchema = z
  .object({
    time: z.string({ required_error: 'Time is required' }),
    period: z.enum(['AM', 'PM'], {
      required_error: 'Period (AM/PM) is required',
    }),
  })
  .transform(({ time, period }) => {
    const [hours, minutes] = time.split(':');
    let adjustedHours = parseInt(hours, 10);
    if (period === 'PM' && adjustedHours !== 12) adjustedHours += 12;
    if (period === 'AM' && adjustedHours === 12) adjustedHours = 0;
    const date = new Date();
    date.setUTCHours(adjustedHours, parseInt(minutes, 10), 0, 0);
    return date.toISOString();
  });

export const updateAdminShiftSchema = z
  .object({
    name: z
      .string()
      .min(3, 'Name must contain at least 3 characters')
      .max(60, 'Name cannot exceed 60 characters')
      .transform((value) => value.toLowerCase())
      .optional(),
    start: timeSchema.optional(),
    end: timeSchema.optional(),
  })
  .strict()
  .refine(
    (data) => {
      if (data.start && data.end) {
        return data.start !== data.end;
      }
      return true;
    },
    {
      message: 'Start and end times cannot be the same',
      path: ['end'],
    },
  );

export class updateAdminShiftDto extends createZodDto(updateAdminShiftSchema) {}
