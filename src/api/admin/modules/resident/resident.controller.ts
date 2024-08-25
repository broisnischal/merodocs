import { Controller, Get, Query } from '@nestjs/common';
import { ResidentService } from './resident.service';
import { AdminUser } from '@prisma/client';
import { ParamId } from 'src/common/decorators';
import { HttpResponse } from 'src/common/utils';
import { AdminLoggedUser } from '../../common/decorators';
import { QueryDto } from 'src/common/validator/query.validator';

@Controller('resident')
export class ResidentController {
  constructor(private readonly service: ResidentService) {}

  @Get('current')
  async getResidentList(
    @Query()
    { q, sortBy, page, limit, blocks, floors, flats, residentType }: QueryDto,
    @AdminLoggedUser() loggedUserData: AdminUser,
  ): Promise<HttpResponse> {
    const data = await this.service.getResidentCurrent({
      apartmentId: loggedUserData.apartmentId,
      q,
      sort: sortBy,
      extended: {
        blocks,
        flats,
        floors,
        sortBy,
      },
      page,
      limit,
      residentType,
    });

    return new HttpResponse({
      data,
    });
  }

  @Get('movedout')
  async getResidentMovedOutList(
    @Query()
    { q, sortBy, page, limit, flats, floors, blocks, residentType }: QueryDto,
    @AdminLoggedUser() loggedUserData: AdminUser,
  ): Promise<HttpResponse> {
    const data = await this.service.getResidentMovedOut({
      page,
      limit,
      q,
      sort: sortBy,
      extended: {
        blocks,
        flats,
        floors,
        sortBy,
      },
      residentType,
      apartmentId: loggedUserData.apartmentId,
    });

    return new HttpResponse({
      data,
    });
  }

  @Get(':id')
  async getResidentById(
    @ParamId() id: string,
    @AdminLoggedUser() loggedUserData: AdminUser,
  ): Promise<HttpResponse> {
    const data = await this.service.getResidentById({
      id,
      apartmentId: loggedUserData.apartmentId,
    });

    return new HttpResponse({
      data,
    });
  }
}
