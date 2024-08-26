import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export const logoutAdminUserSchema = z
  .object({
    refreshToken: z.string({ required_error: 'RefreshToken is required' }),
    deviceId: z.string({ required_error: 'DeviceId is required' }),
  })
  .strict();

export class logoutAdminUserDto extends createZodDto(logoutAdminUserSchema) {}

export interface logoutAdminUserInputDto
  extends z.infer<typeof logoutAdminUserSchema> {
  accessToken: string;
}
