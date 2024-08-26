import { Body, Controller, Delete, Get, Post } from '@nestjs/common';
import { GuestService } from './guest.service';
import {
  CreateGuestDto,
  MultiGuestDto,
  MultiGuestOnePassDto,
} from './dto/guest.dto';
import { HttpResponse } from 'src/common/utils';
import { FlatClientUser } from '../../common/decorators';
import { ParamId } from 'src/common/decorators';

@Controller('guest')
export class GuestController {
  constructor(private readonly service: GuestService) {}

  @Get()
  async get(@FlatClientUser() user: FlatClientUserAuth) {
    const guests = await this.service.getAllGuests({
      user,
    });
    return new HttpResponse({
      message: 'Guests retrived successfully',
      data: guests,
    });
  }

  @Post()
  async createGuest(
    @Body() body: CreateGuestDto,
    @FlatClientUser() user: FlatClientUserAuth,
  ) {
    const guest = await this.service.createGuest({
      body,
      user,
    });
    return new HttpResponse({
      message: 'Your pre approval request for guest is notified to guard',
      data: guest,
    });
  }

  @Post('multiple')
  async createMultipleGuest(
    @Body() body: MultiGuestDto,
    @FlatClientUser() user: FlatClientUserAuth,
  ) {
    const guest = await this.service.createMultiGuest({
      body,
      user,
    });

    return new HttpResponse({
      message: 'Your pre approval request for guest is notified to guard',
      data: guest,
    });
  }

  @Post('mass')
  async createMassGuest(
    @Body() body: MultiGuestOnePassDto,
    @FlatClientUser() user: FlatClientUserAuth,
  ) {
    const guest = await this.service.createMultiGuestOnePass({
      user,
      body,
    });
    return new HttpResponse({
      message: 'Guests Invited Successfully',
      data: guest,
    });
  }

  @Get('frequent')
  async getFrequent(@FlatClientUser() user: FlatClientUserAuth) {
    const guests = await this.service.getAllFrequentGuests({ user });
    return new HttpResponse({
      message: 'Guests retrived successfully',
      data: guests,
    });
  }

  @Get('inviter')
  async getInviter(@FlatClientUser() user: FlatClientUserAuth) {
    const data = await this.service.getWhoInvited({ user });
    return new HttpResponse({
      message: 'Inviter details listed below:',
      data,
    });
  }

  @Get('share/:id')
  async getId(
    @ParamId() id: string,
    @FlatClientUser() user: FlatClientUserAuth,
  ): Promise<HttpResponse> {
    const data = await this.service.share({
      id,
      user,
    });

    return new HttpResponse({
      data,
    });
  }

  @Delete('mass/:id')
  async deleteGuestMass(
    @ParamId() id: string,
    @FlatClientUser() user: FlatClientUserAuth,
  ) {
    const data = await this.service.deleteGuestMass({
      id,
      user,
    });

    return new HttpResponse({
      message: 'Guest Mass Deleted Successfully',
      data,
    });
  }

  @Delete(':id')
  async deleteGuest(
    @ParamId() id: string,
    @FlatClientUser() user: FlatClientUserAuth,
  ) {
    const data = await this.service.deleteGuest({
      id,
      user,
    });

    return new HttpResponse({
      message: 'Guest Deleted Successfully',
      data,
    });
  }
}
