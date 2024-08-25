import 'dotenv/config';
import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.string().transform((val, ctx) => {
    if (!/^[0-9]+$/.test(val)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'PORT: Not a number',
      });
    }

    return parseInt(val);
  }),
  TOKEN_STORE_LIMIT: z.string().transform((val, ctx) => {
    if (!/^[0-9]+$/.test(val)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'TOKEN_STORE_LIMIT: Not a number',
      });
    }

    return parseInt(val);
  }),
  ADMIN_JWT_ACCESS_SECRET: z.string().min(20),
  ADMIN_JWT_REFRESH_SECRET: z.string().min(20),
  SUPERADMIN_JWT_ACCESS_SECRET: z.string().min(20),
  SUPERADMIN_JWT_REFRESH_SECRET: z.string().min(20),
  USER_JWT_ACCESS_SECRET: z.string().min(20),
  USER_JWT_REFRESH_SECRET: z.string().min(20),
  GUARD_JWT_ACCESS_SECRET: z.string().min(20),
  GUARD_JWT_REFRESH_SECRET: z.string().min(20),

  AWS_ACCESS_KEY_ID: z.string(),
  AWS_SECRET_ACCESS_KEY: z.string(),
  AWS_REGION: z.string(),
  AWS_BUCKET: z.string(),
  CLOUDFRONT: z.string().url(),
  HOME_NOTICE_DAYS: z.string().transform((val, ctx) => {
    if (!/^[0-9]+$/.test(val)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'HOME_NOTICE_DAYS: Not a number',
      });
    }

    return parseInt(val);
  }),
  APARTMENT_INACTIVE_DAYS: z.string().transform((val, ctx) => {
    if (!/^[0-9]+$/.test(val)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'APARTMENT_INACTIVE_DAYS: Not a number',
      });
    }

    return parseInt(val);
  }),
  EMAIL_SENDER: z.string().email(),
  OTP_SECRET: z.string(),
  ADMIN_RESET_SECRET: z.string(),
  CLIENT_ADMIN_PANEL_URL: z.string().url(),
  OTP_TIME_LIMIT: z.string().transform((val) => parseInt(val)),
  CLIENT_SUPERADMIN_PANEL_URL: z.string().url(),
  SUPERADMIN_RESET_SECRET: z.string(),
  RESET_TIME_LIMIT: z.string(),
  FLAT_REQUEST_TIMES: z.string().transform((val) => parseInt(val)),
  CLIENT_FIREBASE_PROJECT_ID: z.string(),
  CLIENT_FIREBASE_CLIENT_EMAIL: z.string(),
  CLIENT_FIREBASE_PRIVATE_KEY: z.string(),
  GUARD_FIREBASE_PROJECT_ID: z.string(),
  GUARD_FIREBASE_CLIENT_EMAIL: z.string(),
  GUARD_FIREBASE_PRIVATE_KEY: z.string(),
  SPARROW_SMS_TOKEN: z.string(),
  SUPERADMIN_EMAIL: z.string().email().toLowerCase(),
});

export type envType = z.infer<typeof envSchema>;

type change<T> = {
  [P in keyof T]: T[P] extends number ? string : T[P];
};

declare global {
  namespace NodeJS {
    interface ProcessEnv extends change<envType> {}
  }
}
