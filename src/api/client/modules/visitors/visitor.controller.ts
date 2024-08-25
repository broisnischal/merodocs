import { Controller, Get, Query } from '@nestjs/common';
import { VisitorService } from './visitor.service';
import { HttpResponse } from 'src/common/utils';
import { FlatClientUser } from '../../common/decorators';
import { getMyVisitorsDto } from './dtos/get-myVisitors.dto';

@Controller('visitor')
export class VisitorController {
  constructor(private readonly service: VisitorService) {}

  @Get('')
  async getVisitors(
    @FlatClientUser() user: FlatClientUserAuth,
  ): Promise<HttpResponse> {
    const data = await this.service.getVisitors({
      user,
    });

    return new HttpResponse({
      data,
    });
  }

  @Get('staff')
  async getVisitorsStaff(
    @FlatClientUser() user: FlatClientUserAuth,
  ): Promise<HttpResponse> {
    const data = await this.service.getPersonalStaffInOut({
      user,
    });

    return new HttpResponse({
      data,
    });
  }

  @Get('my')
  async getMyVisitors(
    @FlatClientUser() user: FlatClientUserAuth,
    @Query() { page, limit, start, end, requestType }: getMyVisitorsDto,
  ): Promise<HttpResponse> {
    const data = await this.service.getMyVisitors({
      user,
      page,
      limit,
      extend: {
        type: requestType,
        end: end?.toDate(),
        start: start?.toDate(),
      },
    });

    return new HttpResponse({
      data,
    });
  }
}
