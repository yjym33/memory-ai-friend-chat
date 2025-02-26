import { Injectable } from '@nestjs/common';

@Injectable()
export class UploadService {
  async saveFile(file: Express.Multer.File) {
    console.log('💾 파일 저장 정보:', {
      originalName: file.originalname,
      savedAs: file.filename,
      path: file.path,
      size: file.size,
    });

    // 파일 정보 반환
    return {
      originalName: file.originalname,
      filename: file.filename,
      path: file.path,
      size: file.size,
    };
  }
}
