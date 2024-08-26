import { z } from 'nestjs-zod/z';
import { createZodDto } from 'nestjs-zod';
import { CheckInOutRequestTypeEnum } from '@prisma/client';
import moment from 'moment';

const checkInQuerySchema = z
  .object({
    requestType: z
      .nativeEnum(CheckInOutRequestTypeEnum, {
        required_error: 'Request Type is required',
      })
      .optional(),
    page: z
      .string()
      .transform((val, ctx) => {
        if (!/^[0-9]+$/.test(val)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Page: Not a number',
          });
        }

        return parseInt(val);
      })
      .default('1'),
    limit: z
      .string()
      .transform((val, ctx) => {
        if (!/^[0-9]+$/.test(val)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Limit: Not a number',
          });
        }

        return parseInt(val);
      })
      .default('2'),
    start: z
      .string()
      .transform((val, ctx) => {
        const today = moment().startOf('day');

        const date = moment(val, 'YYYY-MM-DD', true);

        if (!date.isValid()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Start: Invalid date',
          });
        }

        if (date.isAfter(today, 'day')) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Start: Cannot be future date',
          });
        }

        return date.startOf('day');
      })
      .optional(),
    end: z
      .string()
      .transform((val, ctx) => {
        const today = moment().endOf('day');

        const date = moment(val, 'YYYY-MM-DD', true);

        if (!date.isValid()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'End: Invalid date',
          });
        }

        if (date.isAfter(today, 'day')) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'End: Cannot be future date',
          });
        }

        return date.endOf('day');
      })
      .optional(),
  })
  .refine(
    (data) => {
      if (data.start && data.end && data.start.isAfter(data.end)) {
        return false;
      }

      return true;
    },
    { message: 'Start: Cannot be greater than End' },
  );

export class checkInQueryDto extends createZodDto(checkInQuerySchema) {}
