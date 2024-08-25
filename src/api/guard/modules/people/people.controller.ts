import { Controller, Get, Query } from '@nestjs/common';
import { PeopleService } from './people.service';
import { GuardUser } from '@prisma/client';
import { HttpResponse } from 'src/common/utils';
import { CurrentGuardUser } from '../../common/decorators';
import { QueryDto } from 'src/common/validator/query.validator';
import { ParamId } from 'src/common/decorators';

@Controller()
export class PeopleController {
  constructor(private readonly service: PeopleService) {}

  @Get('count')
  async getAllCount(@CurrentGuardUser() loggedUserData: GuardUser) {
    const data = await this.service.getAllCount({
      apartmentId: loggedUserData.apartmentId,
    });

    return new HttpResponse({
      message: 'Counts are listed below:',
      data,
    });
  }

  @Get('resident-block')
  async getResidentsBlock(
    @CurrentGuardUser() loggedUserData: GuardUser,
    @Query() { q }: QueryDto,
  ) {
    const data = await this.service.getResidentsBlock({
      apartmentId: loggedUserData.apartmentId,
      q,
    });

    return new HttpResponse({
      message: 'Blocks are listed below:',
      data,
    });
  }

  @Get('resident-list/:id')
  async getResidentsList(
    @CurrentGuardUser() loggedUserData: GuardUser,
    @Query() { q }: QueryDto,
    @ParamId() id: string,
  ) {
    const data = await this.service.getResidentsList({
      id,
      apartmentId: loggedUserData.apartmentId,
      q,
    });

    return new HttpResponse({
      message: 'Residents are listed below:',
      data,
    });
  }

  @Get('resident-flat/:id')
  async getResidentFlat(
    @CurrentGuardUser() loggedUserData: GuardUser,
    @ParamId() id: string,
  ) {
    const data = await this.service.getResidentsByFlatId({
      id,
      apartmentId: loggedUserData.apartmentId,
    });

    return new HttpResponse({
      message: 'Residents are listed below:',
      data,
    });
  }

  @Get('resident/:id')
  async getResidentsById(
    @CurrentGuardUser() loggedUserData: GuardUser,
    @ParamId() id: string,
  ) {
    const data = await this.service.getResidentsById({
      id,
      apartmentId: loggedUserData.apartmentId,
    });

    return new HttpResponse({
      message: 'Details is listed below:',
      data,
    });
  }

  @Get('resident-staff')
  async getResidentStaff(
    @CurrentGuardUser() loggedUserData: GuardUser,
    @Query() { q }: QueryDto,
  ) {
    const data = await this.service.getResidentStaff({
      apartmentId: loggedUserData.apartmentId,
      q,
    });

    return new HttpResponse({
      message: 'Staffs are listed below:',
      data,
    });
  }

  @Get('resident-staff/:id')
  async getResidentStaffById(
    @CurrentGuardUser() loggedUserData: GuardUser,
    @ParamId() id: string,
  ) {
    const data = await this.service.getResidentStaffById({
      id,
      apartmentId: loggedUserData.apartmentId,
    });

    return new HttpResponse({
      message: 'Details is listed below:',
      data,
    });
  }

  @Get('society-staff')
  async getSocietyStaff(
    @CurrentGuardUser() loggedUserData: GuardUser,
    @Query() { q }: QueryDto,
  ) {
    const data = await this.service.getSocietyStaff({
      apartmentId: loggedUserData.apartmentId,
      q,
    });

    return new HttpResponse({
      message: 'Staffs are listed below:',
      data,
    });
  }

  @Get('society-staff/:id')
  async getSocietyStaffById(
    @CurrentGuardUser() loggedUserData: GuardUser,
    @ParamId() id: string,
  ) {
    const data = await this.service.getSocietyStaffById({
      id,
      apartmentId: loggedUserData.apartmentId,
    });

    return new HttpResponse({
      message: 'Details is listed below:',
      data,
    });
  }

  @Get('management')
  async getManagement(
    @CurrentGuardUser() loggedUserData: GuardUser,
    @Query() { q }: QueryDto,
  ) {
    const data = await this.service.getManagement({
      apartmentId: loggedUserData.apartmentId,
      q,
    });

    return new HttpResponse({
      message: 'Management are listed below:',
      data,
    });
  }

  @Get('list')
  async getGuard(
    @CurrentGuardUser() loggedUserData: GuardUser,
    @Query() { q }: QueryDto,
  ) {
    const data = await this.service.getGuard({
      apartmentId: loggedUserData.apartmentId,
      q,
    });

    return new HttpResponse({
      message: 'Management are listed below:',
      data,
    });
  }

  @Get('clockedin/:id')
  async getGuardClockedInById(
    @CurrentGuardUser() loggedUserData: GuardUser,
    @ParamId() id: string,
  ) {
    const data = await this.service.getSingleGuard({
      apartmentId: loggedUserData.apartmentId,
      id,
    });

    return new HttpResponse({
      message: 'Management are listed below:',
      data,
    });
  }

  @Get('clockedin')
  async getGuardClockedIn(
    @CurrentGuardUser() loggedUserData: GuardUser,
    @Query() { q }: QueryDto,
  ) {
    const data = await this.service.getGuardClockedIn({
      apartmentId: loggedUserData.apartmentId,
      q,
    });

    return new HttpResponse({
      message: 'Management are listed below:',
      data,
    });
  }

  @Get('management/clockedin')
  async getManagementClocked(
    @CurrentGuardUser() loggedUserData: GuardUser,
    @Query() { q }: QueryDto,
  ) {
    const data = await this.service.getManagementClockedIn({
      apartmentId: loggedUserData.apartmentId,
      q,
    });

    return new HttpResponse({
      message: 'Management are listed below:',
      data,
    });
  }

  @Get('management/clockedin/:id')
  async getSingleManagementClockedIn(
    @CurrentGuardUser() loggedUserData: GuardUser,
    @ParamId() id: string,
  ) {
    const data = await this.service.getSingleManagementClockedIn({
      apartmentId: loggedUserData.apartmentId,
      id,
    });

    return new HttpResponse({
      message: 'Management are listed below:',
      data,
    });
  }
}
