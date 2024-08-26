import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from './user.service';
import { createUserDto } from './dto/create-user.dto';
import { SuperAdmin } from '@prisma/client';
import { HttpResponse } from 'src/common/utils';
import { QueryDto } from 'src/common/validator/query.validator';
import { SuperAdminUser } from 'src/api/superadmin/common/decorators';
import { createParseFilePipeBuiler } from 'src/common/builder/parsefile-pipe.builder';
import { ParamId } from 'src/common/decorators';
import { FileInterceptor } from '@nestjs/platform-express';
import { updateUserDto } from './dto/update-user.dto';

@Controller('user')
export class UserController {
  constructor(private readonly service: UserService) {}

  @Post()
  async createV1(
    @Body()
    postData: createUserDto,
    @SuperAdminUser() loggedUserData: SuperAdmin,
  ): Promise<HttpResponse> {
    const user = await this.service.create({
      postData,
      loggedUserData,
    });

    return new HttpResponse({
      message: 'User created successfully',
      data: user,
    });
  }

  @Get()
  async getAll(@Query() { archive }: QueryDto): Promise<HttpResponse> {
    const data = await this.service.getAll({
      archive,
    });

    return new HttpResponse({
      data,
    });
  }

  @Get('user-roles')
  async getAllRoles(): Promise<HttpResponse> {
    const data = await this.service.getAllRoles();

    return new HttpResponse({
      data,
    });
  }

  @Get(':id')
  async getSingle(@ParamId() id: string): Promise<HttpResponse> {
    const data = await this.service.getSingle({
      id,
    });

    return new HttpResponse({
      data,
    });
  }

  @Put(':id')
  async update(
    @Body() postData: updateUserDto,
    @SuperAdminUser() loggedUserData: SuperAdmin,
    @ParamId() id: string,
  ): Promise<HttpResponse> {
    const data = await this.service.update({
      id,
      postData,
      loggedUserData,
    });

    return new HttpResponse({
      message: 'User updated successfully',
      data,
    });
  }

  @Put(':id/image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @UploadedFile(createParseFilePipeBuiler('image'))
    file: Express.Multer.File,
    @SuperAdminUser() loggedUserData: SuperAdmin,
    @ParamId() id: string,
  ): Promise<HttpResponse> {
    const data = await this.service.upload({
      id: id,
      loggedUserData,
      postData: file,
    });

    return new HttpResponse({
      message: 'Image uploaded successfully',
      data,
    });
  }

  @Put(':id/archive')
  async archiveOrRestore(
    @SuperAdminUser() loggedUserData: SuperAdmin,
    @ParamId() id: string,
  ): Promise<HttpResponse> {
    const data = await this.service.archiveOrRestore({
      id,
      loggedUserData,
      postData: undefined,
    });

    return new HttpResponse({
      message: `User ${data.archive ? 'archived' : 'restored'} successfully`,
      data,
    });
  }

  @Delete(':id')
  async delete(
    @SuperAdminUser() loggedUserData: SuperAdmin,
    @ParamId() id: string,
  ): Promise<HttpResponse> {
    await this.service.delete({
      id,
      loggedUserData,
    });

    return new HttpResponse({
      message: `User deleted successfully`,
    });
  }
}
