import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';
import { ClientUserRequestTypeEnum, ClientUserType } from '@prisma/client';

const requestSchema = z.object({
  flatId: z
    .string({
      required_error: "flatId can't be empty",
    })
    .uuid(),
  type: z.nativeEnum(ClientUserType, {
    required_error: 'Type can not be empty',
  }),
  residing: z
    .boolean()
    .refine((value) => value === true || value === false, {
      message: 'Residing must be true or false',
    })
    .transform((value) => value === true)
    .optional(),
});

export const requestQueryDTO = z.object({
  type: z.nativeEnum(ClientUserRequestTypeEnum).optional(),
});

const updateSchema = z.object({
  move_in: z
    .string({
      required_error: "Move in can't be empty",
    })
    .optional(),
  residing: z
    .boolean()
    .refine((value) => value === true || value === false, {
      message: 'Residing must be true or false',
    })
    .transform((value) => value === true)
    .optional(),
});

const moveOutSchema = z.object({
  move_out: z.string().datetime(),
});

const declineSchema = z.object({
  message: z.string({
    required_error: "Message can't be empty",
  }),
});

const optionalDeclineSchema = declineSchema.deepPartial();

// const requestSchema = z.object({
//   data: z.discriminatedUnion(
//     'type',
//     [
//       z.object({
//         type: z.literal('owner'),
//         flatId: z
//           .string({
//             required_error: "Flat Id can't be empty",
//           })
//           .uuid(),
//         userType: z.nativeEnum(ClientUserType),
//         residing: z.boolean(),
//       }),
//       z.object({ type: z.literal('owner_family'), message: z.string() }),
//       z.object({ type: z.literal('tenant'), value: z.string() }),
//       z.object({ type: z.literal('tenant_family'), family: z.string() }),
//     ],
//     {
//       required_error: 'Invalid Request data',
//     },
//   ),
// });

export class CreateRequestDto extends createZodDto(requestSchema) {}
export class UpdateRequestDto extends createZodDto(updateSchema) {}
export class QueryRequestDTO extends createZodDto(requestQueryDTO) {}

export class DeclineRequestDto extends createZodDto(
  declineSchema.deepPartial(),
) {}
export class OptionalDeclineRequestDto extends createZodDto(
  optionalDeclineSchema,
) {}
export class MoveOutRequestDto extends createZodDto(moveOutSchema) {}
