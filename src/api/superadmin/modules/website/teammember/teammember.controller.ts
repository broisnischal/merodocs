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
import { TeamMemberService } from './teammember.service';
import { createTeamMemberDto, updateTeamMemberDto } from './dtos/index.dto';
import { HttpResponse } from 'src/common/utils';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  createOptionalParseFilePipeBuiler,
  createParseFilePipeBuiler,
} from 'src/common/builder/parsefile-pipe.builder';
import { SuperAdminUser } from 'src/api/superadmin/common/decorators';
import { SuperAdmin } from '@prisma/client';
import { QueryDto } from 'src/common/validator/query.validator';
import { ParamId } from 'src/common/decorators';

@Controller('team-member')
export class TeamMemberController {
  constructor(private readonly service: TeamMemberService) {}

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  async create(
    @Body() postData: createTeamMemberDto,
    @UploadedFile(createParseFilePipeBuiler('image')) file: Express.Multer.File,
    @SuperAdminUser() loggedUserData: SuperAdmin,
  ): Promise<HttpResponse> {
    await this.service.create({
      postData: {
        ...postData,
        file,
      },
      loggedUserData,
    });

    return new HttpResponse({
      message: 'Member successfully created',
    });
  }

  @Get()
  async get(@Query() { filter }: QueryDto): Promise<HttpResponse> {
    const data = await this.service.getAll({
      filter,
    });

    return new HttpResponse({
      data,
    });
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('image'))
  async update(
    @ParamId() id: string,
    @Body() postData: updateTeamMemberDto,
    @SuperAdminUser() loggedUserData: SuperAdmin,
    @UploadedFile(createOptionalParseFilePipeBuiler('image'))
    file: Express.Multer.File,
  ): Promise<HttpResponse> {
    await this.service.update({
      id,
      postData: {
        ...postData,
        file,
      },
      loggedUserData,
    });

    return new HttpResponse({
      message: 'Member updated successfully',
    });
  }

  @Put(':id/feature')
  async featureOrUnfeature(
    @ParamId() id: string,
    @SuperAdminUser() loggedUserData: SuperAdmin,
  ): Promise<HttpResponse> {
    const data = await this.service.featureOrUnfeature({
      id,
      postData: undefined,
      loggedUserData,
    });

    return new HttpResponse({
      message: `Member ${data.featured ? 'featured' : 'unfeatured'} successfully`,
    });
  }

  @Put(':id/archive')
  async archiveOrUnarchive(
    @ParamId() id: string,
    @SuperAdminUser() loggedUserData: SuperAdmin,
  ): Promise<HttpResponse> {
    const data = await this.service.archiveOrUnarchive({
      id,
      postData: undefined,
      loggedUserData,
    });

    return new HttpResponse({
      message: `Member ${data.archive ? 'archived' : 'restored'} successfully`,
    });
  }

  @Delete(':id')
  async delete(
    @ParamId() id: string,
    @SuperAdminUser() loggedUserData: SuperAdmin,
  ): Promise<HttpResponse> {
    await this.service.delete({
      id,
      loggedUserData,
    });

    return new HttpResponse({
      message: 'Member deleted successfully',
    });
  }
}
