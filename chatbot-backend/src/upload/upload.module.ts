import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { FileSecurityService } from './services/file-security.service';
import { FileCleanupService } from './services/file-cleanup.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [UploadController],
  providers: [UploadService, FileSecurityService, FileCleanupService],
  exports: [FileSecurityService, FileCleanupService],
})
export class UploadModule {}
