import { BlogStatusEnum } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export const createBlogSchema = z
  .object({
    title: z.string({ required_error: 'Name is required' }),
    slug: z
      .string({ required_error: 'Slug is required' })
      .toLowerCase()
      .refine((value) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value), {
        message: 'Invalid slug',
      }),
    description: z.string({ required_error: 'Description is required' }),
    content: z.string({ required_error: 'Content is required' }),
    publishDate: z.string({ required_error: 'Publish Date is required' }),
    status: z.nativeEnum(BlogStatusEnum, {
      required_error: 'Status is required! Allowed draft or published only',
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
      ),
    categoryId: z.string({ required_error: 'CategoryId is required' }),
  })
  .strict();

export class createBlogDto extends createZodDto(createBlogSchema) {}
