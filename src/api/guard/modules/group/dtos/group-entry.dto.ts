import { VehicleTypeEnum } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';
import {
  contactSchema,
  stringSchema,
} from 'src/common/validator/body.validator';

const groupSchema = z.object({
  name: stringSchema('name'),
  contact: contactSchema(),
  vehicleType: z.nativeEnum(VehicleTypeEnum).optional(),
  vehicleNo: z.string().optional(),
  description: stringSchema('description').optional(),
  groupId: z.string(),
});

export class CreateGroupDto extends createZodDto(groupSchema) {}

// import { VehicleTypeEnum } from '@prisma/client';
// import { createZodDto } from 'nestjs-zod';
// import { z } from 'nestjs-zod/z';

// const groupSchema = z.object({
//   group: z.array(
//     z.object({
//       name: z.string({ required_error: 'Name is required' }),
//       contact: z
//         .string({ required_error: 'Contact number is required' })
//         .refine((value) => /^[0-9]{10}$/.test(value), {
//           message: 'Invalid Contact Number',
//         })
//         .transform((val) => `${val}`),
//       vehicleType: z.nativeEnum(VehicleTypeEnum).optional(),
//     }),
//   ),
//   description: z.string().optional(),
// });

// export class CreateGroupDto extends createZodDto(groupSchema) {}
