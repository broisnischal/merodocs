import { Body, Controller, Delete, Get, Post } from '@nestjs/common';
import { RideService } from './ride.service';
import { CreateRideDto } from './dto/ride.dto';
import { HttpResponse } from 'src/common/utils';
import { FlatClientUser } from '../../common/decorators';
import { createRideTypeDto } from './dto';
import { ParamId } from 'src/common/decorators';

@Controller('ride')
export class RideController {
  constructor(private readonly service: RideService) {}

  @Get()
  async getRide(@FlatClientUser() user: FlatClientUserAuth) {
    const rides = await this.service.getRides({
      user,
    });
    return new HttpResponse({
      message: 'Rides retrived successfully',
      data: rides,
    });
  }

  @Post()
  async inviteRider(
    @Body() body: CreateRideDto,
    @FlatClientUser() user: FlatClientUserAuth,
  ) {
    const rider = await this.service.inviteRide({
      body,
      user,
    });

    return new HttpResponse({
      message: 'Your pre approval request for ride is notified to guard',
      data: rider,
    });
  }

  @Delete('cancel/:id')
  async cancelRider(
    @ParamId() id: string,
    @FlatClientUser() user: FlatClientUserAuth,
  ) {
    const rider = await this.service.cancelRider({
      id,
      user,
    });

    return new HttpResponse({
      message: 'Rider canceled successfully',
      data: rider as any,
    });
  }

  @Get('type')
  async getRiderType(@FlatClientUser() user: FlatClientUserAuth) {
    const data = await this.service.get({ user });

    return new HttpResponse({
      message: 'Rider types fetched successfully',
      data,
    });
  }

  @Post('type')
  async createRideType(
    @Body() body: createRideTypeDto,
    @FlatClientUser() user: FlatClientUserAuth,
  ) {
    const data = await this.service.createRideType({
      body,
      user,
    });

    return new HttpResponse({
      message: 'Ride type created successfully',
      data,
    });
  }
}
