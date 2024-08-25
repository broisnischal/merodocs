import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export const requestResetPasswordSchema = z
  .object({
    password: z
      .string({ required_error: 'Password is required' })
      .min(8, 'Password must be at least 8 characters')
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
  .strict()
  .refine((data) => data.password === data.cpassword, {
    message: 'Password must be same',
    path: ['cpassword'],
  });

export class ResetUserPasswordDto extends createZodDto(
  requestResetPasswordSchema,
) {}
