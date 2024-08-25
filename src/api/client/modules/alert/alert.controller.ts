import { Body, Controller, Get, Post } from '@nestjs/common';
import { AlertService } from './alert.service';
import { CreateAlertDto } from './dto/create-alert.dto';
import { HttpResponse } from 'src/common/utils';
import { FlatClientUser } from '../../common/decorators';
import { ParamId } from 'src/common/decorators';

@Controller('alert')
export class AlertController {
  constructor(private readonly service: AlertService) {}

  @Post()
  async create(
    @Body() body: CreateAlertDto,
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

  @Get(':id')
  async get(
    @FlatClientUser() user: FlatClientUserAuth,
    @ParamId() id: string,
  ): Promise<HttpResponse> {
    const data = await this.service.getAlert({
      id,
      user,
    });

    return new HttpResponse({
      data,
    });
  }
}
