import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

const updateBannerSchema = z
  .object({
    title: z.string({ required_error: 'Title is required' }).min(3).max(100),
    redirectLink: z.string().url().optional(),
  })
  .strict();

export class updateBannerDto extends createZodDto(updateBannerSchema) {}
