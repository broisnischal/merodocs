import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { AdminLoggedUser } from 'src/api/admin/common/decorators';
import { QueryDto } from 'src/common/validator/query.validator';
import { ParamId } from 'src/common/decorators';
import { HttpResponse } from 'src/common/utils';
import {
  createSurveillanceDto,
  updateSurveillanceDto,
} from './dto/surveillance.dto';
import { SurveillanceService } from './surveillance.service';
import { AdminUser } from '@prisma/client';

@Controller('surveillance')
export class SurveillanceController {
  constructor(private readonly service: SurveillanceService) {}

  @Post()
  async create(
    @Body() postData: createSurveillanceDto,
    @AdminLoggedUser() loggedUserData: CurrentUser,
  ) {
    const data = await this.service.create({
      postData,
      loggedUserData,
      apartmentId: loggedUserData.apartmentId,
    });

    return new HttpResponse({
      message: 'Surveillance Created successfully',
      data,
    });
  }

  @Get()
  async getall(
    @Query() { archive }: QueryDto,
    @AdminLoggedUser() loggedUser: CurrentUser,
  ) {
    const data = await this.service.getAll({
      archive,
      apartmentId: loggedUser.apartmentId,
    });

    return new HttpResponse({
      message: 'Surveillance retrived successfully',
      data,
    });
  }

  @Put('/:id')
  async update(
    @ParamId() id: string,
    @Body() postData: updateSurveillanceDto,
    @AdminLoggedUser() loggedUserData: AdminUser,
  ) {
    const data = await this.service.update({
      id,
      loggedUserData,
      apartmentId: loggedUserData.apartmentId,
      postData,
    });
    return new HttpResponse({
      message: 'Surveillance Updated successfully',
      data,
    });
  }

  @Delete('/:id')
  async deleteGate(
    @ParamId() id: string,
    @AdminLoggedUser() loggedUserData: AdminUser,
  ) {
    const data = await this.service.delete({
      id,
      loggedUserData,
      apartmentId: loggedUserData.apartmentId,
    });

    return new HttpResponse({
      message: 'Surveillance Deleted Successfully',
      data,
    });
  }

  @Put('/:id/archive')
  async archiveOrRestore(
    @AdminLoggedUser() loggedUserData: AdminUser,
    @ParamId('id') id: string,
  ) {
    const data = await this.service.archiveOrRestore({
      id,
      loggedUserData,
      apartmentId: loggedUserData.apartmentId,
      postData: undefined,
    });

    return new HttpResponse({
      message: `Surveillance ${data.archive ? 'archived' : 'restored'} successfully`,
      data,
    });
  }
}
