import moment from 'moment';
import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

const dateQuerySchema = z
  .object({
    type: z.enum(['daily', 'monthly', 'yearly'], {
      required_error: 'Type is required',
    }),
    year: z.string({ required_error: 'Year is required' }).min(4).max(4),
    month: z.string().optional(),
    day: z.string().optional(),
    // date: z.string().optional(),
  })
  .strict()
  .transform((arg, ctx) => {
    let date: string = '';
    let start: Date = moment().startOf('day').toDate();
    let end: Date = moment().endOf('day').toDate();

    if (arg.type === 'daily') {
      if (!arg.month)
        ctx.addIssue({ code: 'custom', message: 'Month is required' });
      if (!arg.day)
        ctx.addIssue({ code: 'custom', message: 'Day is required' });
      if (
        moment(
          `${arg.year}-${arg.month}-${arg.day}`,
          'YYYY-MM-DD',
          true,
        ).isValid()
      ) {
        date = `${arg.year}-${arg.month}-${arg.day}`;
        start = moment(date, 'YYYY-MM-DD', true).startOf('day').toDate();
        end = moment(date, 'YYYY-MM-DD', true).endOf('day').toDate();
      } else {
        ctx.addIssue({
          code: 'custom',
          message: 'Invalid date format',
        });
      }
    } else if (arg.type === 'monthly') {
      if (!arg.month)
        ctx.addIssue({ code: 'custom', message: 'Month is required' });

      if (moment(`${arg.year}-${arg.month}`, 'YYYY-MM', true).isValid()) {
        date = `${arg.year}-${arg.month}`;
        start = moment(date, 'YYYY-MM', true)
          .startOf('month')
          .startOf('day')
          .toDate();
        end = moment(date, 'YYYY-MM', true)
          .endOf('month')
          .endOf('day')
          .toDate();
      } else {
        ctx.addIssue({
          code: 'custom',
          message: 'Invalid date format',
        });
      }
    } else {
      if (moment(arg.year, 'YYYY', true).isValid()) {
        date = arg.year;
        start = moment(date, 'YYYY', true)
          .startOf('year')
          .startOf('day')
          .toDate();
        end = moment(date, 'YYYY', true).endOf('year').endOf('day').toDate();
      } else {
        ctx.addIssue({
          code: 'custom',
          message: 'Invalid date format',
        });
      }
    }

    const now = moment().add(1, 'day').toDate();

    if (start > now) {
      ctx.addIssue({
        code: 'custom',
        message: 'Date should not be future date',
      });
    }

    return {
      ...arg,
      start,
      end,
      date,
    };
  });

export class dateQueryDto extends createZodDto(dateQuerySchema) {}
