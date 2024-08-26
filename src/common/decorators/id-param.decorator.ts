import {
  BadRequestException,
  ExecutionContext,
  createParamDecorator,
} from '@nestjs/common';
import { capitalize } from 'lodash';
import { z } from 'zod';

export const ParamId = createParamDecorator(
  (data: string = 'id', ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();

    const id = req.params?.[data];

    const idSchema = z.string().uuid();

    try {
      idSchema.parse(id);

      return id;
    } catch (error: unknown) {
      throw new BadRequestException(`Invalid ${capitalize(data)}`);
    }
  },
);
