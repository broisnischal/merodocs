import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { CommentService } from './comment.service';
import { createCommentDto } from './dtos/comment.dto';
import { AdminUser } from '@prisma/client';
import { AdminLoggedUser } from 'src/api/admin/common/decorators';
import { HttpResponse } from 'src/common/utils';
import { FileInterceptor } from '@nestjs/platform-express';
import { createOptionalParseFilePipeBuiler } from 'src/common/builder/parsefile-pipe.builder';

@Controller('comment')
export class CommentController {
  constructor(private readonly service: CommentService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @Body() postData: createCommentDto,
    @AdminLoggedUser() loggedUserData: AdminUser,
    @UploadedFile(createOptionalParseFilePipeBuiler('image'))
    image?: Express.Multer.File,
  ): Promise<HttpResponse> {
    const data = await this.service.create({
      postData: {
        ...postData,
        image,
      },
      loggedUserData,
      apartmentId: loggedUserData.apartmentId,
    });

    return new HttpResponse({
      message: 'Maintenance comment created successfully',
      data,
    });
  }
}
