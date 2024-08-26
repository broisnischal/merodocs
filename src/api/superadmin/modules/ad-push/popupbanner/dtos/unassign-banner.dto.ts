import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

const unassignBannerSchema = z
  .object({
    apartmentId: z.string({ required_error: 'Apartment id is required' }),
  })
  .strict({});
export class unassignBannerDto extends createZodDto(unassignBannerSchema) {}
