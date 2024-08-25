import { Module } from '@nestjs/common';
import { DocumentTypeService } from './document-type.service';
import { DocumentTypeController } from './document-type.controller';

@Module({
  providers: [DocumentTypeService],
  controllers: [DocumentTypeController],
})
export class DocumentTypeModule {}
