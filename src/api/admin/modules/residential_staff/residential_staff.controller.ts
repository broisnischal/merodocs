import { Controller, Get, Query } from '@nestjs/common';
import { ResidentialStaffService } from './residential_staff.service';
import { QueryDto } from 'src/common/validator/query.validator';
import { AdminLoggedUser } from '../../common/decorators';
import { AdminUser } from '@prisma/client';
import { HttpResponse } from 'src/common/utils';
import { ParamId } from 'src/common/decorators';

@Controller('residential_staff')
export class ResidentialStaffController {
  constructor(private readonly service: ResidentialStaffService) {}

  @Get()
  async getAll(
    @Query() { page, limit, q, flats, floors, blocks, sortBy }: QueryDto,
    @AdminLoggedUser() loggedUserData: AdminUser,
  ): Promise<HttpResponse> {
    const data = await this.service.getAll({
      page,
      limit,
      q,
      extended: {
        blocks,
        flats,
        floors,
        sortBy,
      },
      apartmentId: loggedUserData.apartmentId,
    });

    return new HttpResponse({
      ...data,
    });
  }

  @Get(':id')
  async getSingle(
    @ParamId() id: string,
    @AdminLoggedUser() loggedUserData: AdminUser,
  ): Promise<HttpResponse> {
    const data = await this.service.getSingle({
      id,
      apartmentId: loggedUserData.apartmentId,
    });

    return new HttpResponse({
      data,
    });
  }
}
