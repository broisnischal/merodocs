import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { DetailsService } from './details.service';
import { HttpResponse, enumToArray } from 'src/common/utils';
import { QueryDto } from 'src/common/validator/query.validator';
import { GuardUser, VehicleTypeEnum } from '@prisma/client';
import { CurrentGuardUser } from '../../common/decorators';
import { ParamId } from 'src/common/decorators';

@Controller('details')
export class DetailsController {
  constructor(private readonly service: DetailsService) {}

  @Get('flats')
  async getAllFlats(
    @Query() { q }: QueryDto,
    @CurrentGuardUser() loggedUserData: GuardUser,
  ): Promise<HttpResponse> {
    const data = await this.service.getAllFlats({
      q,
      apartmentId: loggedUserData.apartmentId,
    });

    return new HttpResponse({
      data,
    });
  }

  @Get('vehicle-types')
  async getAllVehicles(): Promise<HttpResponse> {
    const data = enumToArray(VehicleTypeEnum);

    return new HttpResponse({
      data,
    });
  }

  @Get('service-types')
  async getAllServices(
    @Query() { q }: QueryDto,
    @CurrentGuardUser() loggedUserData: GuardUser,
  ): Promise<HttpResponse> {
    const data = await this.service.getAllServices({
      q,
      apartmentId: loggedUserData.apartmentId,
    });

    return new HttpResponse({
      data,
    });
  }

  @Get('service-providers')
  async getAllServiceProviders(
    @Query() { q, providerType }: QueryDto,
    @CurrentGuardUser() loggedUserData: GuardUser,
  ): Promise<HttpResponse> {
    const data = await this.service.getAllServiceProviders({
      q,
      apartmentId: loggedUserData.apartmentId,
      extended: {
        type: providerType,
      },
    });

    return new HttpResponse({
      data,
    });
  }

  @Get('preapproved-count')
  async getPreapprovedCount(
    @CurrentGuardUser() loggedUserData: GuardUser,
  ): Promise<HttpResponse> {
    const data = await this.service.getPreapprovedCounts({
      apartmentId: loggedUserData.apartmentId,
    });

    return new HttpResponse({
      data,
    });
  }

  @Get('flat-member/:id')
  async getFlatMember(
    @ParamId() id: string,
    @CurrentGuardUser() loggedUserData: GuardUser,
  ): Promise<HttpResponse> {
    const data = await this.service.getFlatMember({
      apartmentId: loggedUserData.apartmentId,
      id,
    });

    return new HttpResponse({
      data,
    });
  }

  @Get('profile')
  async profile(@CurrentGuardUser() user: CurrentGuardUser) {
    const data = await this.service.getProfile(user);

    if (!data) {
      throw new BadRequestException('User doesnot exists!');
    }

    return new HttpResponse({
      message: 'User data is listed below:',
      data,
    });
  }

  @Get('surveillance')
  async getSurveillance(@CurrentGuardUser() loggedUserData: GuardUser) {
    const data = await this.service.getSurveillance({
      apartmentId: loggedUserData.apartmentId,
    });

    return new HttpResponse({
      data,
    });
  }
}
