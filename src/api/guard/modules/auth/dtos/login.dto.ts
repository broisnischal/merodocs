import { DeviceTypeEnum } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export const loginGuardUserSchema = z
  .object({
    username: z
      .string({ required_error: 'Username is required' })
      .transform((value) => {
        return value.toLowerCase();
      }),
    passcode: z.string({ required_error: 'Passcode is required' }),
    deviceId: z.string({ required_error: 'DeviceId is required' }),
    fcmToken: z.string({ required_error: 'FcmToken is required' }),
    deviceType: z.nativeEnum(DeviceTypeEnum, {
      required_error: 'Device type is required',
    }),
  })
  .strict();
export class loginGuardUserDto extends createZodDto(loginGuardUserSchema) {}
