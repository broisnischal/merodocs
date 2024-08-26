import { Controller, Get, Query } from '@nestjs/common';
import { FlatClientUser } from 'src/api/client/common/decorators';
import { HttpResponse } from 'src/common/utils';
import { NoticeService } from './notice.service';
import { QueryDto } from 'src/common/validator/query.validator';
import { ParamId } from 'src/common/decorators';

@Controller('notice')
export class NoticeController {
  constructor(private readonly service: NoticeService) {}

  //!not used
  @Get('latest')
  async get(@FlatClientUser() user: FlatClientUserAuth): Promise<HttpResponse> {
    const data = await this.service.getRecent({
      user,
    });

    return new HttpResponse({
      data,
    });
  }

  @Get()
  async getAll(
    @FlatClientUser() user: FlatClientUserAuth,
    @Query() { page, limit, filter }: QueryDto,
  ): Promise<HttpResponse> {
    const data = await this.service.getAll({
      page,
      limit,
      filter,
      user,
    });

    return new HttpResponse({
      ...data,
    });
  }

  @Get(':id')
  async getId(
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
}
