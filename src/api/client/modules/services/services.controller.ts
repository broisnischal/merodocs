import { Body, Controller, Delete, Get, Post } from '@nestjs/common';
import { FlatClientUser } from '../../common/decorators';
import { CreateServiceUserDto } from './dto/service.dto';
import { HttpResponse } from 'src/common/utils';
import { SUserService } from './services.service';
import { createServiceTypeDto } from './dto';
import { ParamId } from 'src/common/decorators';

@Controller('serviceuser')
export class SUserController {
  constructor(private readonly service: SUserService) {}

  @Get('providers')
  async getProviders(@FlatClientUser() user: FlatClientUserAuth) {
    const providers = await this.service.getAllServiceProviders({ user });
    return new HttpResponse({
      message: 'Service providers retrived successfully!',
      data: providers,
    });
  }

  @Get(':id')
  async get(@ParamId() id: string, @FlatClientUser() user: FlatClientUserAuth) {
    const data = await this.service.getSingle({
      id,
      user,
    });

    return new HttpResponse({
      message: 'Service user retrived successfully!',
      data,
    });
  }

  @Get()
  async getAll(@FlatClientUser() user: FlatClientUserAuth) {
    const data = await this.service.getAll({
      user,
    });

    return new HttpResponse({
      message: 'Service user list!',
      data,
    });
  }

  @Post()
  async create(
    @Body() body: CreateServiceUserDto,
    @FlatClientUser() user: FlatClientUserAuth,
  ) {
    const data = await this.service.create({
      body,
      user,
    });

    return new HttpResponse({
      message: 'Your pre approval request for service is notified to guard',
      data,
    });
  }

  @Delete(':id')
  async delete(
    @ParamId() id: string,
    @FlatClientUser() user: FlatClientUserAuth,
  ) {
    const data = await this.service.delete({
      id,
      user,
    });

    return new HttpResponse({
      message: 'Service user cancelled successfully!',
      data,
    });
  }

  @Post('type')
  async createServiceType(
    @Body() body: createServiceTypeDto,
    @FlatClientUser() user: FlatClientUserAuth,
  ) {
    const data = await this.service.createServiceType({
      body,
      user,
    });

    return new HttpResponse({
      message: 'Service type created successfully',
      data,
    });
  }
}
