import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

const createCustomerReviewSchema = z.object({
  name: z
    .string({ required_error: 'Name is required.' })
    .trim()
    .min(3)
    .max(50)
    .toLowerCase(),
  designation: z
    .string({ required_error: 'Designation is required.' })
    .trim()
    .min(3)
    .max(50)
    .toLowerCase(),
  society: z
    .string({ required_error: 'Society is required.' })
    .trim()
    .min(3)
    .max(50),
  location: z
    .string({ required_error: 'Location is required.' })
    .trim()
    .min(3)
    .max(50)
    .toLowerCase(),
  description: z
    .string({ required_error: 'Description is required.' })
    .trim()
    .min(3)
    .max(400),
});

export class createCustomerReviewDto extends createZodDto(
  createCustomerReviewSchema,
) {}
