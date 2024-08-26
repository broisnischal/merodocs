import moment from 'moment';
import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';
import { contactSchema } from 'src/common/validator/body.validator';

const createOfflineResidentSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .nonempty()
    .transform((val) => val.trim().toLowerCase()),
  contact: contactSchema(),
  email: z
    .string({ required_error: 'Email is required' })
    .email()
    .transform((val) => val.trim().toLowerCase()),
  type: z.enum(['owner', 'tenant'], { required_error: 'Type is required' }),
  initiationDate: z
    .string({ required_error: 'Initiation Date is required' })
    .transform((val, ctx) => {
      const date = moment(val, 'YYYY-MM-DD', true);

      if (!date.isValid())
        ctx.addIssue({ message: 'Invalid date format', code: 'custom' });

      return date.toDate();
    }),
});

export class createOfflineResidentDto extends createZodDto(
  createOfflineResidentSchema,
) {}
