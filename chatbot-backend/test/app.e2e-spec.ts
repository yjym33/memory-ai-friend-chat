import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../src/auth/entity/user.entity';
import { Conversation } from '../src/chat/entity/conversation.entity';
import { AiSettings } from '../src/ai-settings/entity/ai-settings.entity';

describe('App E2E Tests', () => {
  let app: INestApplication;
  let userRepository: any;
  let conversationRepository: any;

  beforeAll(async () => {
    // 테스트 환경 설정
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-secret-key';
    process.env.DB_SYNCHRONIZE = 'true';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // CORS 설정 (테스트용)
    app.enableCors();

    await app.init();

    // Repository 참조 가져오기
    userRepository = moduleFixture.get(getRepositoryToken(User));
    conversationRepository = moduleFixture.get(
      getRepositoryToken(Conversation),
    );
  });

  afterAll(async () => {
    // 테스트 데이터 정리
    await conversationRepository.clear();
    await userRepository.clear();
    await app.close();
  });

  describe('Health Check', () => {
    it('/ (GET) - 애플리케이션이 실행 중이어야 한다', () => {
      return request(app.getHttpServer())
        .get('/')
        .expect(200)
        .expect('Hello World!');
    });
  });

  describe('Auth E2E', () => {
    const testUser = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      gender: 'male',
      birthYear: '1990',
    };

    it('POST /auth/register - 새 사용자를 등록해야 한다', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token');
          expect(res.body).toHaveProperty('user');
          expect(res.body.user.email).toBe(testUser.email);
        });
    });

    it('POST /auth/register - 중복 이메일로 등록 시 409 에러', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(409);
    });

    it('POST /auth/login - 올바른 자격증명으로 로그인해야 한다', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token');
          expect(res.body).toHaveProperty('user');
        });
    });

    it('POST /auth/login - 잘못된 자격증명으로 로그인 시 401 에러', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword',
        })
        .expect(401);
    });
  });

  describe('Chat E2E', () => {
    let accessToken: string;
    let userId: string;

    beforeAll(async () => {
      // 테스트용 사용자 로그인
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      accessToken = loginResponse.body.access_token;
      userId = loginResponse.body.user.id;
    });

    it('POST /chat/conversations - 새 대화를 생성해야 한다', () => {
      return request(app.getHttpServer())
        .post('/chat/conversations')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ userId })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('title');
          expect(res.body.userId).toBe(userId);
        });
    });

    it('GET /chat/conversations/:userId - 사용자의 대화 목록을 조회해야 한다', () => {
      return request(app.getHttpServer())
        .get(`/chat/conversations/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('Upload E2E', () => {
    let accessToken: string;

    beforeAll(async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      accessToken = loginResponse.body.access_token;
    });

    it('POST /upload - 파일을 업로드해야 한다', () => {
      return request(app.getHttpServer())
        .post('/upload')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', Buffer.from('test file content'), 'test.txt')
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('originalName');
          expect(res.body).toHaveProperty('filename');
          expect(res.body).toHaveProperty('path');
          expect(res.body).toHaveProperty('size');
        });
    });
  });

  describe('Error Handling E2E', () => {
    it('GET /nonexistent - 404 에러를 반환해야 한다', () => {
      return request(app.getHttpServer()).get('/nonexistent').expect(404);
    });

    it('Protected route without token - 401 에러를 반환해야 한다', () => {
      return request(app.getHttpServer())
        .get('/chat/conversations/test-user')
        .expect(401);
    });
  });
});
