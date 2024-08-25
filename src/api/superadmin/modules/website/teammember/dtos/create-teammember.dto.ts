import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

const createTeamMemberSchema = z
  .object({
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
  })
  .strict();

export class createTeamMemberDto extends createZodDto(createTeamMemberSchema) {}
