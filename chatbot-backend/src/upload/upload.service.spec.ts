import { Test, TestingModule } from '@nestjs/testing';
import { UploadService } from './upload.service';

describe('UploadService', () => {
  let service: UploadService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UploadService],
    }).compile();

    service = module.get<UploadService>(UploadService);
  });

  it('서비스가 정의되어야 한다', () => {
    expect(service).toBeDefined();
  });

  describe('saveFile', () => {
    it('파일 정보를 저장하고 반환해야 한다', async () => {
      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'test.txt',
        encoding: '7bit',
        mimetype: 'text/plain',
        size: 1024,
        destination: 'uploads/',
        filename: 'test-123.txt',
        path: 'uploads/test-123.txt',
        buffer: Buffer.from('test content'),
        stream: null as any,
      };

      // console.log spy 설정
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const result = await service.saveFile(mockFile);

      expect(consoleSpy).toHaveBeenCalledWith('💾 파일 저장 정보:', {
        originalName: mockFile.originalname,
        savedAs: mockFile.filename,
        path: mockFile.path,
        size: mockFile.size,
      });

      expect(result).toEqual({
        originalName: mockFile.originalname,
        filename: mockFile.filename,
        path: mockFile.path,
        size: mockFile.size,
      });

      consoleSpy.mockRestore();
    });

    it('파일의 모든 속성을 올바르게 반환해야 한다', async () => {
      const mockFile: Express.Multer.File = {
        fieldname: 'document',
        originalname: 'document.pdf',
        encoding: '7bit',
        mimetype: 'application/pdf',
        size: 2048,
        destination: 'uploads/',
        filename: 'document-456.pdf',
        path: 'uploads/document-456.pdf',
        buffer: Buffer.from('pdf content'),
        stream: null as any,
      };

      const result = await service.saveFile(mockFile);

      expect(result.originalName).toBe('document.pdf');
      expect(result.filename).toBe('document-456.pdf');
      expect(result.path).toBe('uploads/document-456.pdf');
      expect(result.size).toBe(2048);
    });
  });
});
