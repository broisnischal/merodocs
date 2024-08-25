import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Post,
  Put,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { HttpResponse } from 'src/common/utils';
import {
  ClientUnassigned,
  FlatClientUser,
  FlatNotClientUser,
} from '../../common/decorators';
import {
  CreateRequestDto,
  DeclineRequestDto,
  UpdateRequestDto,
} from './dtos/request.dto';
import { ReqService } from './request.service';
import { ParamId, Public } from 'src/common/decorators';

@Controller('request')
export class ReqController {
  constructor(private readonly service: ReqService) {}

  @Get('tenant-members')
  @UseInterceptors(FileInterceptor('document'))
  async getTenantMembers(
    @FlatClientUser() user: FlatClientUserAuth,
  ): Promise<HttpResponse> {
    const data = await this.service.getTenantMembers({
      user,
    });

    return new HttpResponse({
      message: 'Tenant movedout successfully',
      data,
    });
  }

  @Get('remove-tenant')
  @UseInterceptors(FileInterceptor('document'))
  async removeTenant(
    @FlatClientUser() user: FlatClientUserAuth,
  ): Promise<HttpResponse> {
    await this.service.removeTenant({
      user,
    });

    return new HttpResponse({
      message: 'Tenant and tenant family account is deleted from your flat.',
    });
  }

  @Public()
  @Get('/documenttype/:apartmentId')
  async getDocumentType(@ParamId('apartmentId') apartmentId: string) {
    if (!apartmentId) throw new NotFoundException('Apartment not found!');

    const data = await this.service.getDocumentType({
      apartmentId: apartmentId,
    });

    return new HttpResponse({
      message: 'Document Type Retrived!',
      data,
    });
  }

  @Get('current-logs')
  async getCurrentLogs(@FlatNotClientUser() user: FlatOrUserId) {
    const data = await this.service.getCurrentFlatLogs(user);

    return new HttpResponse({
      message: 'Current logs fetched!',
      data,
    });
  }

  @Get('other-flats')
  async getOtherFlats(@FlatNotClientUser() user: FlatOrUserId) {
    const data = await this.service.getOtherRequests({ user });

    return new HttpResponse({
      message: 'Other logs fetched!',
      data,
    });
  }

  @Get('all')
  async getAllApartmentRequest(@FlatClientUser() user: FlatClientUserAuth) {
    const data = await this.service.getAllApartmentRequestOwner({
      user,
    });

    return new HttpResponse({
      message: 'Apartment Flat request fetched!',
      data,
    });
  }

  @Get('document/:id')
  async getDocumentRequestAllList(
    @ClientUnassigned() user: CurrentClientUser,
    @ParamId() id: string,
  ) {
    const data = await this.service.getDocumentRequestAllList({
      user,
      id,
    });

    return new HttpResponse({
      message: 'Apartment Flat request fetched!',
      data,
    });
  }

  @Get(':id')
  async getSingleRequest(
    @ParamId() id: string,
    @ClientUnassigned() user: CurrentClientUser,
  ) {
    const data = await this.service.getSingle({
      id,
      user,
    });

    return new HttpResponse({
      message: 'Request fetched!',
      data,
    });
  }

  @Get()
  async getAllApartment(@ClientUnassigned() user: CurrentClientUser) {
    const data = await this.service.getAllApartmentRequest({
      user,
    });

    return new HttpResponse({
      message: 'Apartment request fetched',
      data,
    });
  }

  @Post()
  async createApartmentRequest(
    @Body() body: CreateRequestDto,
    @ClientUnassigned() user: CurrentClientUser,
  ) {
    const data = await this.service.createApartmentRequest({
      body,
      user,
    });

    return new HttpResponse({
      message: 'Request created successfully',
      data: data,
    });
  }

  @Get('/check/becomeowner')
  async checkBecomeOwnerRequest(@FlatClientUser() user: FlatClientUserAuth) {
    await this.service.becomeOwnerCheck(user);

    return new HttpResponse({
      message: 'Become owner request checked!',
    });
  }

  @Get('/update/becomeowner')
  async becomeOwnerRequest(@FlatClientUser() user: FlatClientUserAuth) {
    const data = await this.service.becomeOwnerRequest(user);

    return new HttpResponse({
      message: 'Become owner requested!',
      data: data,
    });
  }

  @Put(':id')
  async updateApartmentRequest(
    @ParamId() id: string,
    @Body() body: UpdateRequestDto,
    @ClientUnassigned() user: CurrentClientUser,
  ) {
    await this.service.updateRequest({
      id,
      body,
      user,
    });

    return new HttpResponse({
      message: 'Request updated successfully',
    });
  }

  @Put(':id/document/:documentId')
  @UseInterceptors(FilesInterceptor('files'))
  async updateApartmentRequestDocument(
    @UploadedFiles() files: Array<Express.Multer.File>,
    @ParamId() id: string,
    @ParamId('documentId') documentId: string,
    @ClientUnassigned() user: CurrentClientUser,
  ) {
    const update = await this.service.updateRequestDocument({
      user,
      id,
      body: {
        files,
        documentId,
      },
    });

    return new HttpResponse({
      message: 'Request document updated successfully',
      data: update!,
    });
  }

  @Delete(':id')
  async cancelRequest(
    @ParamId() id: string,
    @ClientUnassigned() user: CurrentClientUser,
  ) {
    const data = await this.service.cancelRequest({
      id,
      user,
    });

    return new HttpResponse({
      message: `Your request for ${data.type?.toLowerCase()} is canceled.`,
    });
  }

  @Put('/resubmit/:id')
  @UseInterceptors(FilesInterceptor('files'))
  async resubmit(
    @ParamId() id: string,
    @Body() body: UpdateRequestDto,
    @ClientUnassigned() user: CurrentClientUser,
  ) {
    const update = await this.service.resubmit({
      id,
      body,
      user,
    });

    return new HttpResponse({
      message: 'Request resubmitted successfully',
      data: update!,
    });
  }

  @Delete('/:id/:imageId')
  async deleteSingleImage(
    @ParamId() id: string,
    @ParamId('imageId') imageId: string,
    @ClientUnassigned() user: CurrentClientUser,
  ) {
    await this.service.deleteSingleImage({
      id,
      extend: {
        imageId,
      },
      user,
    });

    return new HttpResponse({
      message: 'Image removed successfully!',
    });
  }

  @Post('/:id/accept')
  async acceptRequest(
    @ParamId() id: string,
    @FlatClientUser() user: FlatClientUserAuth,
  ) {
    const data = await this.service.acceptRequest({
      id,
      user,
      body: undefined,
    });

    return new HttpResponse({
      message: `The request for ${data.type?.toLowerCase()} is accepted.`,
      data,
    });
  }

  @Post('/:id/decline')
  async declineRequestByOwner(
    @ParamId() id: string,
    @FlatClientUser() user: FlatClientUserAuth,
    @Body() body: DeclineRequestDto,
  ) {
    const data = await this.service.declineRequestByOwner({
      id,
      user,
      body,
    });
    return new HttpResponse({
      message: 'Request declined successfully',
      data,
    });
  }
}
