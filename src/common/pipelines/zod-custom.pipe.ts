import { BadRequestException } from '@nestjs/common';
import { createZodValidationPipe } from 'nestjs-zod';
import { ZodError } from 'zod';

export const CustomZodValidationPipe = createZodValidationPipe({
  createValidationException: (error: ZodError) =>
    new BadRequestException({
      success: false,
      message: error.issues[0].message,
      errors: error.issues,
    }),
});
