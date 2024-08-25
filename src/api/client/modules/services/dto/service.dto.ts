import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';
import {
  contactSchema,
  stringSchema,
} from 'src/common/validator/body.validator';

const serviceUserSchema = z.object({
  serviceTypeId: z
    .string({
      required_error: "Provider can't be empty",
    })
    .uuid({
      message: 'Please select the service type',
    }),
  name: stringSchema('name'),
  contact: contactSchema(),
  fromDate: z
    .string({
      required_error: 'From date (fromDate) cannot be empty.',
    })
    .datetime(),
  toDate: z
    .string({
      required_error: 'To date (toDate) cannot be empty.',
    })
    .datetime(),
  always: z.boolean(),
});

export class CreateServiceUserDto extends createZodDto(serviceUserSchema) {}

const updateSchema = serviceUserSchema.deepPartial();

export class UpdateServiceUserDto extends createZodDto(updateSchema) {}
