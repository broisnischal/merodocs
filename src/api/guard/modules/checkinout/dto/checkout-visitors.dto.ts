import { z } from 'nestjs-zod/z';
import { createZodDto } from 'nestjs-zod';
import { CheckInOutRequestTypeEnum } from '@prisma/client';

const checkOutSchema = z.object({
  type: z
    .nativeEnum(CheckInOutRequestTypeEnum, {
      required_error: 'Request Type is required',
    })
    .optional(),
  id: z
    .string({ required_error: 'Id is required' })
    .uuid({ message: 'Invalid UUID' }),
});

export class checkOutVisitorsDto extends createZodDto(checkOutSchema) {}
