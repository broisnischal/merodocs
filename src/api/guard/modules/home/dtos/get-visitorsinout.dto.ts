import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

const getVisitorsInOutSchema = z.object({
  requestType: z
    .enum(['all', 'guest', 'delivery', 'ride', 'service'])
    .default('all')
    .optional(),
});

export class getVisitorsInOutDto extends createZodDto(getVisitorsInOutSchema) {}
