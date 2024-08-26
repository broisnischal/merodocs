import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export const createGuardShiftSchema = z
  .object({
    name: z
      .string({ required_error: 'Name is required' })
      .min(3, 'Name must contain at least 3 characters')
      .max(60, 'Name cannot exceed 60 characters')
      .transform((value) => value.toLowerCase()),
    start: z
      .object({
        time: z.string({ required_error: 'Start time is required' }),
        period: z.enum(['AM', 'PM'], {
          required_error: 'Start period (AM/PM) is required',
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
      }),
    end: z
      .object({
        time: z.string({ required_error: 'End time is required' }),
        period: z.enum(['AM', 'PM'], {
          required_error: 'End period (AM/PM) is required',
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
      }),
  })
  .strict()
  .refine((data) => data.start !== data.end, {
    message: 'Start and end times cannot be the same',
    path: ['end'],
  });
export class createGuardShiftDto extends createZodDto(createGuardShiftSchema) {}
