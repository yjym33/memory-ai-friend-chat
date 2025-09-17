import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentController } from './document.controller';
import { DocumentService } from './document.service';
import { VectorService } from './vector.service';
import { Document } from './entity/document.entity';
import { DocumentChunk } from './entity/document-chunk.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Document, DocumentChunk])],
  controllers: [DocumentController],
  providers: [DocumentService, VectorService],
  exports: [DocumentService, VectorService],
})
export class DocumentModule {}
