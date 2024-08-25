import { Controller, Post } from '@nestjs/common';
import { CurrentGuardUser } from '../../common/decorators';
import { GuardUser } from '@prisma/client';
import { ClockInOutService } from './clockinout.service';
import { HttpResponse } from 'src/common/utils';
import { ParamId } from 'src/common/decorators';

@Controller('clockinout')
export class ClockInOutController {
  constructor(private readonly service: ClockInOutService) {}

  @Post(':id')
  async clockIn(
    @CurrentGuardUser() loggedUserData: GuardUser,
    @ParamId() id: string,
  ) {
    const data = await this.service.clockInOutGuard({
      id,
      loggedUserData,
      postData: undefined,
      apartmentId: loggedUserData.apartmentId,
    });

    return new HttpResponse({
      data,
    });
  }

  @Post('admin/:id')
  async clockInAdmin(
    @CurrentGuardUser() loggedUserData: GuardUser,
    @ParamId() id: string,
  ) {
    const data = await this.service.clockInOutAdmin({
      id,
      loggedUserData,
      postData: undefined,
      apartmentId: loggedUserData.apartmentId,
    });

    return new HttpResponse({
      data,
    });
  }
}
