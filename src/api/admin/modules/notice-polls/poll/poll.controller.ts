import { Body, Controller, Delete, Get, Post, Query } from '@nestjs/common';
import { PollService } from './poll.service';
import { AdminLoggedUser } from '../../../common/decorators';
import { AdminUser } from '@prisma/client';
import { HttpResponse } from 'src/common/utils';
import { ParamId } from 'src/common/decorators';
import { QueryDto } from '../../../../../common/validator/query.validator';
import { createPollDto } from './dtos/index.dto';
import { AdminActivityService } from 'src/global/activity/admin-activity.service';

@Controller('poll')
export class PollController {
  constructor(
    private readonly service: PollService,
    private readonly activityService: AdminActivityService,
  ) {}

  @Post()
  async create(
    @Body() postData: createPollDto,
    @AdminLoggedUser() loggedUserData: AdminUser,
  ): Promise<HttpResponse> {
    const data = await this.service.create({
      postData,
      loggedUserData,
      apartmentId: loggedUserData.apartmentId,
    });

    return new HttpResponse({
      message: 'Poll created successfully',
      data,
    });
  }

  @Get('activity')
  async getActivity(
    @AdminLoggedUser() loggedUserData: AdminUser,
    @Query() { page, limit }: QueryDto,
  ): Promise<HttpResponse> {
    const data = await this.activityService.getAllWithPagination({
      apartmentId: loggedUserData.apartmentId,
      page,
      limit,
      type: 'poll',
    });

    return new HttpResponse({
      ...data,
    });
  }

  @Get('')
  async getAll(
    @AdminLoggedUser()
    loggedUserData: AdminUser,
    @Query() { archive }: QueryDto,
  ): Promise<HttpResponse> {
    const data = await this.service.getAll({
      apartmentId: loggedUserData.apartmentId,
      archive,
    });

    return new HttpResponse({
      data,
    });
  }

  @Delete(':id')
  async delete(
    @ParamId() id: string,
    @AdminLoggedUser() loggedUserData: AdminUser,
  ): Promise<HttpResponse> {
    const data = await this.service.delete({
      id,
      loggedUserData,
      apartmentId: loggedUserData.apartmentId,
    });

    return new HttpResponse({
      message: 'Poll deleted successfully',
      data,
    });
  }
}
