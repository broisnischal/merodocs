import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';
import { contactSchema } from 'src/common/validator/body.validator';

export const signUpClientUser = z
  .object({
    contact: contactSchema(),
  })
  .strict();

export class signUpClientUserDto extends createZodDto(signUpClientUser) {}

const refreshSchema = z.object({
  token: z.string(),
});

export class RefreshDto extends createZodDto(refreshSchema) {}

const switchSchema = z.object({
  flatId: z
    .string({
      required_error: 'Flat Id is required',
    })
    .uuid(),
});

export class SwitchDto extends createZodDto(switchSchema) {}
