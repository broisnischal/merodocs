//* not used for now
// import { VehicleTypeEnum } from '@prisma/client';
// import { createZodDto } from 'nestjs-zod';
// import { z } from 'nestjs-zod/z';

// export const createMultipleGuestSchema = z
//   .object({
//     guests: z
//       .array(
//         z.object({
//           name: z.string({ required_error: 'Name is required' }),
//           contact: z
//             .string({ required_error: 'Contact number is required' })
//             .refine((value) => /^[0-9]{10}$/.test(value), {
//               message: 'Invalid Contact Number',
//             })
//             .transform((val) => `${val}`),
//           vehicleType: z.nativeEnum(VehicleTypeEnum).optional(),
//           vehicleNo: z.string().optional(),
//         }),
//       )
//       .refine((guests) => guests.length > 0, {
//         message: 'At least one guest must be provided',
//       }),
//     flatId: z
//       .string({
//         required_error: 'FlatId is required',
//       })
//       .uuid(),
//   })
//   .strict();

// export class createMultipleGuestDto extends createZodDto(
//   createMultipleGuestSchema,
// ) {}
