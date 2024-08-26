import { Module } from '@nestjs/common';
import { GalleryDocumentController } from './gallery-document.controller';
import { GalleryDocumentService } from './gallery-document.service';

@Module({
  controllers: [GalleryDocumentController],
  providers: [GalleryDocumentService],
})
export class GalleryDocumentModule {}
