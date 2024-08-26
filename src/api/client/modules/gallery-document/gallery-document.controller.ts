import { Controller, Get, Param, Query } from '@nestjs/common';
import { GalleryDocumentService } from './gallery-document.service';
import { QueryDto } from 'src/common/validator/query.validator';
import { documentGalleryDto } from './dto/param.dto';
import { HttpResponse } from 'src/common/utils';
import { FlatClientUser } from 'src/api/client/common/decorators';
import { ParamId } from 'src/common/decorators';

@Controller('gd/:type')
export class GalleryDocumentController {
  constructor(private readonly service: GalleryDocumentService) {}

  @Get()
  async getAll(
    @Param() { type }: documentGalleryDto,
    @Query() { page, limit }: QueryDto,
    @FlatClientUser() user: FlatClientUserAuth,
  ): Promise<HttpResponse> {
    const { data, docs } = await this.service.getAll({
      type,
      page,
      limit,
      user,
    });

    return new HttpResponse({
      data,
      docs,
    });
  }

  @Get(':id')
  async getFiles(
    @Param() { type }: documentGalleryDto,
    @ParamId() id: string,
    @Query() { page, limit }: QueryDto,
    @FlatClientUser() user: FlatClientUserAuth,
  ): Promise<HttpResponse> {
    const { data, docs } = await this.service.getAllFiles({
      id,
      type,
      page,
      limit,
      user,
    });

    return new HttpResponse({
      data,
      docs,
    });
  }
}
