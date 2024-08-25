import { BlogStatusEnum } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export const updateBlogSchema = z
  .object({
    title: z.string({ required_error: 'Name is required' }).optional(),
    slug: z
      .string({ required_error: 'Slug is required' })
      .toLowerCase()
      .refine((value) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value), {
        message: 'Invalid slug',
      })
      .optional(),
    description: z
      .string({ required_error: 'Description is required' })
      .optional(),
    content: z.string({ required_error: 'Content is required' }).optional(),
    publishDate: z
      .string({ required_error: 'Publish Date is required' })
      .optional(),
    status: z.nativeEnum(BlogStatusEnum, {
      required_error: 'Invalid Status Type! Allowed draft or publish only',
    }),
    tags: z
      .string({
        required_error: 'Tags is required',
      })
      .transform((value, ctx) =>
        value.split(',').map((tag) => {
          if (z.string().uuid().safeParse(tag).success) {
            return tag;
          }

          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Tags must be a valid UUID',
          });
          return tag;
        }),
      )
      .optional(),
    categoryId: z
      .string({ required_error: 'CategoryId is required' })
      .optional(),
  })
  .strict();

export class updateBlogDto extends createZodDto(updateBlogSchema) {}
