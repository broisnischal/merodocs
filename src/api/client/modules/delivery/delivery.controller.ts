import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { CreateDeliveryDto } from './dto/delivery.dto';
import { HttpResponse } from 'src/common/utils';
import { FlatClientUser } from '../../common/decorators';
import { ParamId } from 'src/common/decorators';
import { createDeliveryTypeDto } from './dto';
import { QueryDto } from 'src/common/validator/query.validator';

@Controller('delivery')
export class DeliveryController {
  constructor(private readonly service: DeliveryService) {}

  @Get('')
  async getDelivery(@FlatClientUser() user: FlatClientUserAuth) {
    const data = await this.service.getAlldelivery({
      user,
    });
    return new HttpResponse({
      message: 'Delivery retrived successfully',
      data,
    });
  }

  @Get('type')
  async searchDelivery(
    @FlatClientUser() user: FlatClientUserAuth,
    @Query() { q }: QueryDto,
  ) {
    const data = await this.service.searchDelivery({
      user,
      q,
    });

    return new HttpResponse({
      message: 'Delivery retrived successfully',
      data,
    });
  }

  @Post()
  async inviteDelivery(
    @Body() body: CreateDeliveryDto,
    @FlatClientUser() user: FlatClientUserAuth,
  ) {
    const data = await this.service.inviteDelivery({
      body,
      user,
    });

    return new HttpResponse({
      message: 'Your pre approval request for delivery is notified to guard',
      data,
    });
  }

  @Post('type')
  async createRideType(
    @Body() body: createDeliveryTypeDto,
    @FlatClientUser() user: FlatClientUserAuth,
  ) {
    const data = await this.service.createDeliveryType({
      body,
      user,
    });

    return new HttpResponse({
      message: 'Delivery type created successfully',
      data,
    });
  }

  @Delete('cancel/:id')
  async cancelDelivery(
    @ParamId() id: string,
    @FlatClientUser() user: FlatClientUserAuth,
  ) {
    await this.service.cancel({
      id,
      user,
    });

    return new HttpResponse({
      message: 'Delivery canceled successfully',
    });
  }

  @Get('parcel')
  async getParcel(@FlatClientUser() user: FlatClientUserAuth) {
    const data = await this.service.getParcelPending({
      user,
    });

    return new HttpResponse({
      message: 'Pending parcel fetched successfully',
      data,
    });
  }

  @Get('parcel/:id')
  async getParcelById(
    @FlatClientUser() user: FlatClientUserAuth,
    @ParamId() id: string,
  ) {
    const data = await this.service.getParcelById({
      id,
      user,
    });

    return new HttpResponse({
      message: 'Parcel details:',
      data,
    });
  }

  @Put('parcel/:id')
  async updateParcelById(
    @FlatClientUser() user: FlatClientUserAuth,
    @ParamId() id: string,
  ) {
    await this.service.updateParcelById({
      id,
      user,
      body: undefined,
    });

    return new HttpResponse({
      message: 'Parcel updated successfully',
    });
  }

  @Get('history/parcel')
  async getParcelHistory(
    @FlatClientUser() user: FlatClientUserAuth,
    @Query() { page, limit }: QueryDto,
  ) {
    const data = await this.service.getParcelHistory({
      flatId: user.currentState.flatId,
      apartmentId: user.currentState.apartmentId,
      page,
      limit,
    });

    return new HttpResponse({
      data,
    });
  }
}
