import { Controller, Get, Query } from '@nestjs/common';
import { AdminUser } from '@prisma/client';
import { CheckInOutService } from 'src/api/admin/modules/checkinout/checkinout.service';
import { HttpResponse } from 'src/common/utils';
import { QueryDto } from 'src/common/validator/query.validator';
import { AdminLoggedUser } from '../../common/decorators';

@Controller('checkinout')
export class CheckInOutController {
  constructor(private readonly service: CheckInOutService) {}

  @Get('')
  async update(
    @AdminLoggedUser() loggedUserData: AdminUser,
    @Query() { filter, q, sortBy, date, page, limit }: QueryDto,
  ): Promise<HttpResponse> {
    const data = await this.service.getCheckInOut({
      filter,
      apartmentId: loggedUserData.apartmentId,
      q,
      sort: sortBy,
      date,
      page,
      limit,
    });

    return new HttpResponse({
      message: 'Checkinout details:',
      data,
    });
  }
}
