import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

const setDefaultSurveillanceSchema = z.object({
  surveillanceId: z
    .string({ required_error: 'SurveillanceId is required' })
    .uuid({ message: 'Invallid Id' }),
});

export class setDefaultSurveillanceDto extends createZodDto(
  setDefaultSurveillanceSchema,
) {}
