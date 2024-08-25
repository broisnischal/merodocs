import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { FlatClientUser } from 'src/api/client/common/decorators';
import { HttpResponse } from 'src/common/utils';
import { QueryDto } from 'src/common/validator/query.validator';
import { createPollDto } from './dtos/create-poll.dto';
import { PollService } from './poll.service';
import { ParamId } from 'src/common/decorators';

@Controller('poll')
export class PollController {
  constructor(private readonly service: PollService) {}

  @Get('ongoing')
  async get(@FlatClientUser() user: FlatClientUserAuth): Promise<HttpResponse> {
    const data = await this.service.getOngoing({
      user,
    });

    return new HttpResponse({
      data,
    });
  }

  @Get()
  async getAll(
    @Query() { page, limit, filter }: QueryDto,
    @FlatClientUser() user: FlatClientUserAuth,
  ): Promise<HttpResponse> {
    const data = await this.service.getAll({
      user,
      page,
      limit,
      filter,
    });

    return new HttpResponse({
      ...data,
    });
  }

  @Get(':id')
  async getSingle(
    @ParamId() id: string,
    @FlatClientUser() user: FlatClientUserAuth,
  ): Promise<HttpResponse> {
    const data = await this.service.getById({
      id,
      user,
    });

    return new HttpResponse({
      data,
    });
  }

  @Post()
  async create(
    @Body() body: createPollDto,
    @FlatClientUser() user: FlatClientUserAuth,
  ): Promise<HttpResponse> {
    const data = await this.service.create({
      body,
      user,
    });

    return new HttpResponse({
      data,
    });
  }
}
