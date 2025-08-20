import { Test, TestingModule } from '@nestjs/testing';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';

describe('UploadController', () => {
  let controller: UploadController;
  let uploadService: jest.Mocked<UploadService>;

  beforeEach(async () => {
    const mockUploadService = {
      saveFile: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UploadController],
      providers: [
        {
          provide: UploadService,
          useValue: mockUploadService,
        },
      ],
    }).compile();

    controller = module.get<UploadController>(UploadController);
    uploadService = module.get(UploadService);
  });

  it('컨트롤러가 정의되어야 한다', () => {
    expect(controller).toBeDefined();
  });

  describe('uploadFile', () => {
    it('파일을 업로드하고 결과를 반환해야 한다', async () => {
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
        stream: undefined,
      };

      const expectedResult = {
        originalName: 'test.txt',
        filename: 'test-123.txt',
        path: 'uploads/test-123.txt',
        size: 1024,
      };

      uploadService.saveFile.mockResolvedValue(expectedResult);

      const result = await controller.uploadFile(mockFile);

      expect(uploadService.saveFile).toHaveBeenCalledWith(mockFile);
      expect(result).toEqual(expectedResult);
    });

    it('업로드된 파일 정보를 올바르게 처리해야 한다', async () => {
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
        stream: undefined,
      };

      const expectedResult = {
        originalName: 'document.pdf',
        filename: 'document-456.pdf',
        path: 'uploads/document-456.pdf',
        size: 2048,
      };

      uploadService.saveFile.mockResolvedValue(expectedResult);

      const result = await controller.uploadFile(mockFile);

      expect(result.originalName).toBe('document.pdf');
      expect(result.filename).toBe('document-456.pdf');
      expect(result.size).toBe(2048);
    });
  });
});
