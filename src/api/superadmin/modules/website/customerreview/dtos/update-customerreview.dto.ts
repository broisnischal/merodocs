import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

const updateCustomerReviewSchema = z.object({
  name: z
    .string({ required_error: 'Name is required.' })
    .trim()
    .min(3)
    .max(50)
    .toLowerCase()
    .optional(),
  designation: z
    .string({ required_error: 'Designation is required.' })
    .trim()
    .min(3)
    .max(50)
    .toLowerCase()
    .optional(),
  society: z
    .string({ required_error: 'Society is required.' })
    .trim()
    .min(3)
    .max(50),
  location: z
    .string({ required_error: 'Name is required.' })
    .trim()
    .min(3)
    .max(50)
    .toLowerCase()
    .optional(),
  description: z
    .string({ required_error: 'Description is required.' })
    .trim()
    .min(3)
    .max(300)
    .optional(),
});

export class updateCustomerReviewDto extends createZodDto(
  updateCustomerReviewSchema,
) {}
