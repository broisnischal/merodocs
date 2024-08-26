import { Controller, Get, Query } from '@nestjs/common';
import { NPCSectionService } from './npcsection.service';
import { HttpResponse } from 'src/common/utils';
import { getNPCQueryDto } from './dtos/get-npc.dto';

@Controller('npcsection')
export class NPCSectionController {
  constructor(private readonly service: NPCSectionService) {}

  @Get()
  async get(
    @Query() { for: forType, type }: getNPCQueryDto,
  ): Promise<HttpResponse> {
    const data = await this.service.get({
      for: forType,
      type,
    });

    return new HttpResponse({
      data,
    });
  }
}
