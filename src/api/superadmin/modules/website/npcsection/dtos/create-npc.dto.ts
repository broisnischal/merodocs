import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';
import { NPCEnum, SocietyEnum } from '@prisma/client';

export const createNPCSection = z
  .object({
    title: z
      .string({ required_error: 'Title is required.' })
      .trim()
      .min(3)
      .max(100),
    description: z
      .string({
        required_error: 'Description is required.',
      })
      .trim()
      .min(3)
      .max(400),
    for: z.nativeEnum(SocietyEnum, {
      required_error: 'Please select where you are modifying this section.',
    }),
    type: z.nativeEnum(NPCEnum, {
      required_error: 'Type is required.',
    }),
  })
  .strict();

export class createNPCSectionDto extends createZodDto(createNPCSection) {}
