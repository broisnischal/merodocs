import { Body, Controller, Delete, Put } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { SuperAdmin } from '@prisma/client';
import { HttpResponse } from 'src/common/utils';
import { SuperAdminUser } from '../../common/decorators';
import { ParamId } from 'src/common/decorators';
import {
  addSubscriptionDto,
  expireSubscriptionDto,
  renewSubscriptionDto,
  updateInstallmentDto,
  updateSubscriptionDto,
} from './dto/index.dto';

@Controller('/clients/subscription')
export class SubscriptionController {
  constructor(private readonly service: SubscriptionService) {}

  @Put('/renew/:id')
  async renew(
    @ParamId() id: string,
    @Body()
    postData: renewSubscriptionDto,
    @SuperAdminUser() loggedUserData: SuperAdmin,
  ): Promise<HttpResponse> {
    const user = await this.service.renew({
      id,
      postData,
      loggedUserData,
    });

    return new HttpResponse({
      message: 'Subscription renewed successfully',
      data: user,
    });
  }

  @Put('/update/:id')
  async update(
    @ParamId() id: string,
    @Body()
    postData: updateSubscriptionDto,
    @SuperAdminUser() loggedUserData: SuperAdmin,
  ): Promise<HttpResponse> {
    const data = await this.service.update({
      id,
      postData,
      loggedUserData,
    });

    return new HttpResponse({
      message: 'Subscription updated successfully',
      data: data!,
    });
  }

  @Put('add/:id')
  async addInstallment(
    @ParamId() id: string,
    @Body()
    postData: addSubscriptionDto,
    @SuperAdminUser() loggedUserData: SuperAdmin,
  ): Promise<HttpResponse> {
    const user = await this.service.add({
      id,
      postData,
      loggedUserData,
    });

    return new HttpResponse({
      message: 'Installment added successfully',
      data: user,
    });
  }

  @Put('expire/:id')
  async forceExpire(
    @ParamId() id: string,
    @Body()
    postData: expireSubscriptionDto,
    @SuperAdminUser() loggedUserData: SuperAdmin,
  ): Promise<HttpResponse> {
    const user = await this.service.expire({
      id,
      postData,
      loggedUserData,
    });

    return new HttpResponse({
      message: 'Subscription expired successfully',
      data: user,
    });
  }

  @Put('/update-history/:id')
  async updateInstallment(
    @ParamId() id: string,
    @Body()
    postData: updateInstallmentDto,
    @SuperAdminUser() loggedUserData: SuperAdmin,
  ): Promise<HttpResponse> {
    const user = await this.service.updateInstallment({
      id,
      postData,
      loggedUserData,
    });

    return new HttpResponse({
      message: 'Subscription updated successfully',
      data: user,
    });
  }

  @Delete('/delete-history/:id')
  async deleteInstallment(
    @ParamId() id: string,
    @Body()
    @SuperAdminUser()
    loggedUserData: SuperAdmin,
  ): Promise<HttpResponse> {
    const user = await this.service.deleteInstallment({
      id,
      loggedUserData,
    });

    return new HttpResponse({
      message: 'Installment deleted successfully',
      data: user,
    });
  }
}
