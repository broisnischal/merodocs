import {
  Controller,
  Delete,
  Get,
  Put,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { DocumentService } from './document.service';
import { FlatClientUser } from '../../common/decorators';
import { HttpResponse } from 'src/common/utils';
import { FileInterceptor } from '@nestjs/platform-express';
import { ParamId } from 'src/common/decorators';

@Controller('document')
export class DocumentController {
  constructor(private readonly service: DocumentService) {}

  @Get('type')
  async getDocumentType(
    @FlatClientUser() user: FlatClientUserAuth,
  ): Promise<HttpResponse> {
    const data = await this.service.getDocumentType({ user });

    return new HttpResponse({
      data,
    });
  }

  @Get('type/:id')
  async getDocumentsFromType(
    @FlatClientUser() user: FlatClientUserAuth,
    @ParamId() id: string,
  ) {
    const data = await this.service.getDocumentsFromType({
      user,
      id,
    });

    return new HttpResponse({
      data,
    });
  }

  @UseInterceptors(FileInterceptor('file'))
  @Put('file/:id')
  async uploadDocumentFile(
    @FlatClientUser() user: FlatClientUserAuth,
    @ParamId() id: string,
    @UploadedFile() file: MainFile,
  ) {
    const response = await this.service.uploadDocument({
      user,
      body: {
        documentTypeId: id,
        file,
      },
    });

    return new HttpResponse({
      data: response,
      message: 'Document updated successfully',
    });
  }

  @Delete('file/:id')
  async deleteDocumentFile(
    @FlatClientUser() user: FlatClientUserAuth,
    @ParamId('id') id: string,
  ) {
    const response = await this.service.deleteDocument({
      user,
      id,
    });

    return new HttpResponse({
      data: response,
      message: 'Document deleted successfully',
    });
  }
}
