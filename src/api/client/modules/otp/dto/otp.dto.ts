import { DeviceTypeEnum } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';
import { contactSchema } from 'src/common/validator/body.validator';

export const otpVerifySchema = z.object({
  phone: contactSchema(),
  otp: z
    .string({
      required_error: "Otp can't be empty",
    })
    .min(6, {
      message: 'Otp must be 6 characters long',
    })
    .max(6, {
      message: 'Otp must be 6 characters long',
    }),
  hash: z.string({
    required_error: "Hash can't be empty",
  }),
  deviceId: z.string({
    required_error: "DeviceId can't be empty",
  }),
  fcmToken: z.string({
    required_error: "FCM Token can't be empty",
  }),
  deviceType: z.nativeEnum(DeviceTypeEnum, {
    required_error: "Device type can't be empty",
  }),
});

export class OTPVerifyDto extends createZodDto(otpVerifySchema) {}
