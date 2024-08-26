import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export const logoutUserSchema = z
  .object({
    refreshToken: z.string({ required_error: 'RefreshToken is required' }),
  })
  .strict();

export class LogoutUserDto extends createZodDto(logoutUserSchema) {}

export interface LogoutUserInputDto extends z.infer<typeof logoutUserSchema> {
  accessToken: string;
}
