import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

/**
 * API 키 암호화/복호화 서비스
 * 사용자별 API 키를 안전하게 저장하기 위한 암호화 처리
 */
@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly secretKey: Buffer;
  private readonly ivLength = 16;

  constructor() {
    // 환경 변수에서 암호화 키 가져오기 (없으면 기본값 사용)
    const encryptionKey = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-production-32chars!!';
    
    // 32바이트 키 생성 (SHA-256 해시 사용)
    this.secretKey = crypto
      .createHash('sha256')
      .update(encryptionKey)
      .digest();
  }

  /**
   * 텍스트를 암호화합니다.
   * @param text - 암호화할 텍스트
   * @returns 암호화된 텍스트 (base64 인코딩)
   */
  encrypt(text: string): string {
    try {
      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipheriv(this.algorithm, this.secretKey, iv);

      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const authTag = cipher.getAuthTag();

      // IV + 암호화된 텍스트 + Auth Tag를 결합
      const result = {
        iv: iv.toString('hex'),
        encrypted: encrypted,
        authTag: authTag.toString('hex'),
      };

      return Buffer.from(JSON.stringify(result)).toString('base64');
    } catch (error) {
      throw new Error(`암호화 실패: ${error.message}`);
    }
  }

  /**
   * 암호화된 텍스트를 복호화합니다.
   * @param encryptedText - 암호화된 텍스트 (base64 인코딩)
   * @returns 복호화된 텍스트
   */
  decrypt(encryptedText: string): string {
    try {
      const data = JSON.parse(Buffer.from(encryptedText, 'base64').toString('utf8'));

      const iv = Buffer.from(data.iv, 'hex');
      const encrypted = data.encrypted;
      const authTag = Buffer.from(data.authTag, 'hex');

      const decipher = crypto.createDecipheriv(this.algorithm, this.secretKey, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      throw new Error(`복호화 실패: ${error.message}`);
    }
  }

  /**
   * API 키를 안전하게 암호화하여 저장합니다.
   * @param apiKey - 암호화할 API 키
   * @returns 암호화된 API 키
   */
  encryptApiKey(apiKey: string): string {
    if (!apiKey || apiKey.trim() === '') {
      return '';
    }
    return this.encrypt(apiKey);
  }

  /**
   * 암호화된 API 키를 복호화합니다.
   * @param encryptedApiKey - 암호화된 API 키
   * @returns 복호화된 API 키
   */
  decryptApiKey(encryptedApiKey: string): string {
    if (!encryptedApiKey || encryptedApiKey.trim() === '') {
      return '';
    }
    try {
      return this.decrypt(encryptedApiKey);
    } catch (error) {
      console.error('API 키 복호화 실패:', error);
      return '';
    }
  }
}

