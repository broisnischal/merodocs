import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { CommentService } from './comment.service';
import { HttpResponse } from 'src/common/utils';
import { createCommentDto } from './dtos/comment.dto';
import { FlatClientUser } from 'src/api/client/common/decorators';
import { createOptionalParseFilePipeBuiler } from 'src/common/builder/parsefile-pipe.builder';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('comment')
export class CommentController {
  constructor(private readonly service: CommentService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @Body() body: createCommentDto,
    @FlatClientUser() user: FlatClientUserAuth,
    @UploadedFile(createOptionalParseFilePipeBuiler('image'))
    file: Express.Multer.File,
  ): Promise<HttpResponse> {
    const data = await this.service.create({
      body: {
        ...body,
        file,
      },
      user,
    });

    return new HttpResponse({
      message: 'Maintenance comment created successfully',
      data,
    });
  }
}
