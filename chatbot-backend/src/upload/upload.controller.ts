import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          // 한글 파일명 인코딩 문제 해결
          const originalName = Buffer.from(
            file.originalname,
            'latin1',
          ).toString('utf8');
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const extension = extname(originalName);
          callback(null, `${uniqueSuffix}${extension}`);
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

    // 파일명 인코딩 수정
    const originalName = Buffer.from(file.originalname, 'latin1').toString(
      'utf8',
    );

    console.log('✅ 파일 업로드 완료:', {
      originalName: originalName, // 수정된 파일명
      savedAs: file.filename,
      path: file.path,
      size: file.size,
    });

    // 수정된 파일명으로 서비스 호출
    return this.uploadService.saveFile({
      ...file,
      originalname: originalName,
    });
  }
}
