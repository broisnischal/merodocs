import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { createOptionalParseFilePipeBuiler } from 'src/common/builder/parsefile-pipe.builder';
import { HttpResponse } from 'src/common/utils';
import { FlatClientUser } from '../../common/decorators';
import { OptionalDeclineRequestDto } from '../request/dtos/request.dto';
import { MoveOutRequestDto, MoveOutUpdateRequestDto } from './dtos/moveout.dto';
import { MoveOutService } from './moveout.service';
import { ParamId } from 'src/common/decorators';

@Controller('moveout')
export class MoveoutController {
  constructor(private readonly service: MoveOutService) {}

  @Get('all')
  async getAllApartmentMoveoutRequest(
    @FlatClientUser() user: FlatClientUserAuth,
  ) {
    const data = await this.service.getAllApartmentRequestOwner({
      user,
    });

    return new HttpResponse({
      message: 'Apartment request fetched by owner.',
      data,
    });
  }

  @Get()
  async getMyMoveout(@FlatClientUser() user: FlatClientUserAuth) {
    const data = await this.service.getAllApartmentRequest({
      user,
    });

    return new HttpResponse({
      message: 'Moveout request fetched',
      data,
    });
  }

  @Get('/:id')
  async getSingleMoveout(
    @FlatClientUser() user: FlatClientUserAuth,
    @Param() { id }: { id: string },
  ) {
    const data = await this.service.getMoveoutWithID({
      id,
      user,
    });

    return new HttpResponse({
      message: 'Moveout request fetched',
      data,
    });
  }

  @Post()
  @UseInterceptors(FilesInterceptor('files'))
  async moveout(
    @UploadedFiles(createOptionalParseFilePipeBuiler('both'))
    files: Array<Express.Multer.File>,
    @Body() body: MoveOutRequestDto,
    @FlatClientUser() user: FlatClientUserAuth,
  ) {
    const data = await this.service.moveout({
      user,
      body: {
        ...body,
        files,
      },
    });

    return new HttpResponse({
      message: 'Your request for move out is submitted and now pending review.',
      data,
    });
  }

  @Delete('/:requestId/:id')
  async deleteSingleImage(
    @Param('requestId') requestId: string,
    @Param() id: string,
    @FlatClientUser() user: FlatClientUserAuth,
  ) {
    await this.service.deleteSingleImage({
      id,
      body: {
        requestId,
      },
      user,
    });
    return new HttpResponse({
      message: 'Image removed successfully!',
    });
  }

  @Delete(':id')
  async cancelRequest(
    @ParamId() id: string,
    @FlatClientUser() user: FlatClientUserAuth,
  ) {
    await this.service.cancelRequest({
      id,
      user,
    });
    return new HttpResponse({
      message: 'Your request for move out is cancelled',
    });
  }

  @Post('/:id/:type')
  async changeRequestStatus(
    @ParamId() id: string,
    @Param() { type }: { type: string },
    @Body() body: OptionalDeclineRequestDto,
    @FlatClientUser() user: FlatClientUserAuth,
  ) {
    const data = await this.service.changeStatusRequest({
      id,
      user,
      body: {
        ...body,
        // @ts-ignore
        status: type,
      },
    });
    return new HttpResponse({
      message: `Request ${type} successfully`,
      data,
    });
  }

  @Put('/resubmit/:id')
  @UseInterceptors(FilesInterceptor('files'))
  async update(
    @UploadedFiles(createOptionalParseFilePipeBuiler('both'))
    files: Array<Express.Multer.File>,
    @ParamId() id: string,
    @Body() body: MoveOutUpdateRequestDto,
    @FlatClientUser() user: FlatClientUserAuth,
  ) {
    const data = await this.service.resubmit({
      id,
      body: {
        ...body,
        files,
      },
      user,
    });
    return new HttpResponse({
      message:
        'Your request for move out is resubmitted and now pending review.',
      data,
    });
  }

  //!not used
  @Get('members')
  async membersMoving(@FlatClientUser() user: FlatClientUserAuth) {
    const data = await this.service.getmembersMoving({
      user,
    });

    return new HttpResponse({
      message: 'Moving out members fetched successfully!',
      data,
    });
  }
}
