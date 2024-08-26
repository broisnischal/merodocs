import {
  ApartmentClientUserStatusEnum,
  ContactUsStatusEnum,
  FolderAccessEnum,
  MaintenanceStatus,
  MaintenanceTypeEnum,
  ServiceProviderTypeEnum,
} from '@prisma/client';
import moment from 'moment';
import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

const querySchema = z.object({
  archive: z
    .string()
    .refine((value) => ['true', 'false'].includes(value), {
      message: 'Invalid value',
    })
    .transform((value) => value === 'true')
    .default('false'),
  access: z.nativeEnum(FolderAccessEnum).optional(),
  withId: z.string().uuid().optional(),
  page: z
    .string()
    .transform((val, ctx) => {
      if (!/^[0-9]+$/.test(val)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Page: Not a number',
        });
      }

      return parseInt(val);
    })
    .default('1'),
  limit: z
    .string()
    .transform((val, ctx) => {
      if (!/^[0-9]+$/.test(val)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Limit: Not a number',
        });
      }

      return parseInt(val);
    })
    .default('10'),
  q: z
    .string()
    .transform((val) => {
      return val.trim().toLowerCase();
    })
    .optional(),
  filter: z.string().optional(),
  requeststatus: z.nativeEnum(ApartmentClientUserStatusEnum).optional(),
  subscription: z.string().optional(),
  month: z
    .string()
    .transform((val, ctx) => {
      if (!/^[0-9]+$/.test(val)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Month: Not a number',
        });
      }
      return parseInt(val);
    })
    .optional(),
  requestType: z.enum(['accept', 'decline', 'reject']).optional(),
  atSignUp: z
    .string()
    .refine((value) => ['true', 'false'].includes(value), {
      message: 'Invalid value',
    })
    .transform((value) => value === 'true')
    .default('false'),
  token: z.string().optional(),
  year: z
    .string()
    .transform((val, ctx) => {
      if (!/^[0-9]+$/.test(val)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Year: Not a number',
        });
      }
      return parseInt(val);
    })
    .optional(),
  providerType: z.nativeEnum(ServiceProviderTypeEnum).optional(),
  date: z
    .string()
    .transform((val) => val.trim()) // Trim any whitespace
    .optional(),
  flats: z
    .string()
    .transform((val, ctx) => {
      const values = val.split(',');

      return values.map((item) => {
        const id = item.toLowerCase();
        const isUUID = z.string().uuid().safeParse(id);

        if (!isUUID.success) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Flats: Invalid UUID',
          });
        }

        return id;
      });
    })
    .optional(),
  blocks: z
    .string()
    .transform((val, ctx) => {
      const values = val.split(',');

      return values.map((item) => {
        const id = item.toLowerCase();
        const isUUID = z.string().uuid().safeParse(id);

        if (!isUUID.success) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Flats: Invalid UUID',
          });
        }

        return id;
      });
    })
    .optional(),
  floors: z
    .string()
    .transform((val, ctx) => {
      const values = val.split(',');

      return values.map((item) => {
        const id = item.toLowerCase();
        const isUUID = z.string().uuid().safeParse(id);

        if (!isUUID.success) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Flats: Invalid UUID',
          });
        }

        return id;
      });
    })
    .optional(),
  sortBy: z.enum(['asc', 'desc']).optional(),
  residentType: z
    .enum(['owner', 'tenant', 'family', ''])
    .transform((val) => {
      if (val) return val;

      return undefined;
    })
    .optional(),
  ids: z.string().optional(),
  approvalType: z
    .enum(['moveIn', 'moveOut', 'addAccount', 'becomeOwner', 'staffAccount'])
    .default('moveIn')
    .optional(),
  number: z
    .string()
    .transform((val, ctx) => {
      if (!/^[0-9]+$/.test(val)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Number: Not a number',
        });
      }
      return parseInt(val);
    })
    .optional(),
  type: z
    .enum(['ride', 'delivery', 'service', 'guest'])
    .transform((val) => {
      if (val) return val;

      return undefined;
    })
    .optional(),
  ticketType: z.nativeEnum(MaintenanceTypeEnum).optional(),
  ticketStatus: z.nativeEnum(MaintenanceStatus).optional(),
  historyDate: z
    .string()
    .transform((val, ctx) => {
      const today = moment().startOf('day');

      const date = moment(val, 'YYYY-MM-DD', true);

      if (!date.isValid()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Start: Invalid date',
        });
      }

      if (date.isAfter(today, 'day')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Start: Cannot be future date',
        });
      }

      return date.startOf('day');
    })
    .optional(),
  contactstatus: z.nativeEnum(ContactUsStatusEnum).optional(),
  featured: z.string().optional(),
  startDate: z
    .string()
    .transform((val, ctx) => {
      const date = moment(val, 'YYYY-MM-DD', true);

      if (!date.isValid()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Start: Invalid startdate',
        });
      }

      return date.startOf('day');
    })
    .optional(),
  endDate: z
    .string()
    .transform((val, ctx) => {
      const date = moment(val, 'YYYY-MM-DD', true);

      if (!date.isValid()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Start: Invalid end date',
        });
      }

      return date.startOf('day');
    })
    .optional(),
});

export class QueryDto extends createZodDto(querySchema) {}
export type QueryType = z.infer<typeof querySchema>;
