import moment from 'moment';
import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

const moveOutSchema = z.object({
  move_out: z.string().transform((val, ctx) => {
    const date = moment(val);
    if (!date.isValid()) {
      ctx.addIssue({
        code: 'invalid_date',
        message: 'Invalid date format',
      });
    }

    return date.toDate();
  }),
});

export class MoveOutRequestDto extends createZodDto(moveOutSchema) {}
export class MoveOutUpdateRequestDto extends createZodDto(
  moveOutSchema.deepPartial(),
) {}
