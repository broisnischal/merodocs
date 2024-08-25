import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

const updateTeamMemberSchema = z
  .object({
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
  })
  .strict();

export class updateTeamMemberDto extends createZodDto(updateTeamMemberSchema) {}
