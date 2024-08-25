import moment from 'moment';
import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

const creatUpdateAttendance = z
  .object({
    userId: z.string({ required_error: 'User Id is required' }).uuid(),
    eventId: z.string().uuid().optional(),
    date: z.string({ required_error: 'Date is required' }).refine(
      (val) => {
        const date = moment(val, 'YYYY-MM-DD');

        return date.isValid();
      },
      { message: 'Invalid Date format' },
    ),
    clockedIn: z
      .string({ required_error: 'Clock in time is required' })
      .refine(
        (val) => {
          const date = moment(val, 'YYYY-MM-DDTHH:mm:ss');

          return date.isValid();
        },
        { message: 'Invalid DateTime ' },
      )
      .transform((val) => {
        const date = moment(val, 'YYYY-MM-DDTHH:mm:ss');

        return date.toDate();
      }),
    clockedOut: z
      .string({ required_error: 'Clock out time is required' })
      .refine(
        (val) => {
          const date = moment(val, 'YYYY-MM-DDTHH:mm:ss');

          return date.isValid();
        },
        { message: 'Invalid DateTime' },
      )
      .transform((val) => {
        const date = moment(val, 'YYYY-MM-DDTHH:mm:ss');

        return date.toDate();
      }),
  })
  .strict()
  .refine(
    (data) => {
      return +data.clockedOut > +data.clockedIn;
    },
    {
      message: 'ClockedIn cannot be greater than or equal to ClockedOut',
    },
  )
  .refine(
    (data) => {
      const date = moment(data.date, 'YYYY-MM-DD');
      const clockedIn = moment(data.clockedIn, 'YYYY-MM-DDTHH:mm:ss');
      const clockedOut = moment(data.clockedOut, 'YYYY-MM-DDTHH:mm:ss');

      if (clockedIn.isAfter(date, 'day') || clockedOut.isBefore(date, 'day'))
        return false;

      return true;
    },
    {
      message: 'ClockedIn should be on the same day as the date',
    },
  );

export class createUpdateAttendanceDto extends createZodDto(
  creatUpdateAttendance,
) {}
