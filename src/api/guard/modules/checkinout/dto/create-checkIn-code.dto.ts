import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

const CheckInOutEnum = [
  'adminservice',
  'client',
  'clientstaff',
  'guest',
] as const;

export const createCheckInCodeSchema = z
  .object({
    id: z
      .string({ required_error: 'Id is required' })
      .uuid({ message: 'Invalid Id' }),
    type: z.enum(CheckInOutEnum, { required_error: 'Type is required' }),
    flats: z
      .string({ required_error: 'Flats is required' })
      .transform((val) => {
        return val.split(',');
      })
      .optional(),
  })
  .strict()
  .refine(
    (data) =>
      data.type === 'clientstaff'
        ? data.flats
          ? data.flats.length >= 0
          : true
        : true,
    { message: 'Only one flat can be assigned' },
  );

export class createCheckInCodeDto extends createZodDto(
  createCheckInCodeSchema,
) {}
