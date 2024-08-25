import {
  Body,
  Controller,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { ProblemService } from './problem.service';
import { createProblemDto } from './dtos/create-problem.dto';
import { HttpResponse } from 'src/common/utils';
import { FilesInterceptor } from '@nestjs/platform-express';
import { createOptionalParseFilePipeBuiler } from 'src/common/builder/parsefile-pipe.builder';
import { FlatClientUser } from '../../common/decorators';

@Controller('problem')
export class ProblemController {
  constructor(private readonly service: ProblemService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('files'))
  async create(
    @UploadedFiles(createOptionalParseFilePipeBuiler('both'))
    files: Express.Multer.File[],
    @Body() body: createProblemDto,
    @FlatClientUser() user: FlatClientUserAuth,
  ): Promise<HttpResponse> {
    const data = await this.service.create({
      user,
      body: {
        ...body,
        files,
      },
    });

    return new HttpResponse({
      message: 'Problem created successfully',
      data,
    });
  }
}
