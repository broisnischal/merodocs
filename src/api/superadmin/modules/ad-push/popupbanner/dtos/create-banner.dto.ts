import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';
import { stringSchema } from 'src/common/validator/body.validator';

const createBannerSchema = z
  .object({
    title: stringSchema('title'),
    redirectLink: z.string().url().optional(),
  })
  .strict({});

export class createBannerDto extends createZodDto(createBannerSchema) {}
