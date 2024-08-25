import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';
import {
  contactSchema,
  stringSchema,
} from 'src/common/validator/body.validator';

const guestSchema = z.object({
  name: stringSchema('name'),
  contact: contactSchema(),
  startDate: z
    .string({
      required_error: 'Start Date is required',
    })
    .datetime(),
  endDate: z
    .string({
      required_error: 'End Date is required',
    })
    .datetime(),
  backgroundImage: z.string({
    required_error: 'Background image is required',
  }),
  isOneDay: z.boolean({ required_error: 'isOneDay is required' }).default(true),
});

const multiGuestSchema = z.object({
  guests: z
    .array(guestSchema.pick({ name: true, contact: true }), {
      required_error: 'Guests array required',
    })
    .min(1, { message: 'At least one guest is required' })
    .max(10, { message: 'Maximum 10 guests allowed' })
    .refine(
      (value) => {
        const contacts = value.map((guest) => guest.contact);
        return new Set(contacts).size === value.length; // Check if all contacts are unique
      },
      {
        message: 'Contacts must be unique',
      },
    ),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  backgroundImage: z.string({
    required_error: 'Background image is required',
  }),
  isOneDay: z.boolean({ required_error: 'isOneDay is required' }).default(true),
});

const multiGuestOnePassSchema = z.object({
  description: stringSchema('description'),
  number: z.number({ required_error: 'Number is required' }),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  backgroundImage: z.string({
    required_error: 'Background image is required',
  }),
});

export class CreateGuestDto extends createZodDto(guestSchema) {}

const updateSchema = guestSchema.deepPartial();

export class UpdateGuestDto extends createZodDto(updateSchema) {}

export class MultiGuestDto extends createZodDto(multiGuestSchema) {}

export class MultiGuestOnePassDto extends createZodDto(
  multiGuestOnePassSchema,
) {}
