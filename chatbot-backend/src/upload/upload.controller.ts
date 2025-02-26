import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          callback(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (
          !file.originalname.match(
            /\.(jpg|jpeg|png|gif|pdf|doc|docx|txt|xls|xlsx|ppt|pptx)$/,
          )
        ) {
          return callback(
            new BadRequestException('지원하지 않는 파일 형식입니다.'),
            false,
          );
        }
        callback(null, true);
      },
      limits: {
        fileSize: 100 * 1024 * 1024, // 100MB로 제한 수정
      },
    }),
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      console.error('❌ 파일이 업로드되지 않음');
      throw new BadRequestException('파일이 업로드되지 않았습니다.');
    }

    console.log('✅ 파일 업로드 완료:', {
      originalName: file.originalname,
      savedAs: file.filename,
      path: file.path,
      size: file.size,
    });

    return this.uploadService.saveFile(file);
  }
}
