import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

const assignBannerSchema = z
  .object({
    apartmentIds: z
      .string({ required_error: 'Apartment id is required' })
      .array()
      .min(1, 'Apartment id is required'),
  })
  .strict({});

export class assignBannerDto extends createZodDto(assignBannerSchema) {}
