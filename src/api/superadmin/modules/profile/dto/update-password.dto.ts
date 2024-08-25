import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const updatePasswordSchema = z
  .object({
    password: z
      .string({ required_error: 'Password is required' })
      .refine(
        (value) =>
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
            value,
          ),
        {
          message:
            'Password must contain at least one uppercase letter, one digit and one special characters and have minimum 8 characters',
        },
      ),
    cpassword: z.string({ required_error: 'Confirm Password is required' }),
  })
  .refine((data) => data.password === data.cpassword, {
    message: 'Passwords do not match',
    path: ['cpassword'],
  });

export class updatePasswordDto extends createZodDto(updatePasswordSchema) {}
