import { Controller, Get } from '@nestjs/common';
import { HttpResponse } from 'src/common/utils';
import { FlatClientUser, FlatNotClientUser } from '../../common/decorators';
import { ClientCommonService } from './clientcommon.service';

@Controller('common')
export class ClientCommonController {
  constructor(private readonly service: ClientCommonService) {}

  @Get('banner')
  async getBanner(@FlatClientUser() user: FlatClientUserAuth) {
    const data = await this.service.getBanner({ user });

    return new HttpResponse({
      message: 'Banner details',
      data: data,
    });
  }

  @Get('status')
  async statusDetails(@FlatNotClientUser() user: FlatOrUserId) {
    const data = await this.service.statusDetails({ user });

    return new HttpResponse({
      message: 'Home details',
      data,
    });
  }

  @Get('home')
  async homeDetails(@FlatNotClientUser() value: FlatOrUserId) {
    const data = await this.service.homeDetails({ user: value });

    return new HttpResponse({
      message: 'Home details',
      data: data!,
    });
  }
}
