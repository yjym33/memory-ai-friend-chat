import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-kakao';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class KakaoStrategy extends PassportStrategy(Strategy, 'kakao') {
  private isConfigured: boolean;

  constructor(private configService: ConfigService) {
    const clientID =
      configService.get<string>('oauth.kakao.clientId') ||
      process.env.KAKAO_CLIENT_ID ||
      'dummy-client-id';
    const callbackURL =
      configService.get<string>('oauth.kakao.callbackUrl') ||
      process.env.KAKAO_CALLBACK_URL ||
      'http://localhost:8080/auth/kakao/callback';

    super({
      clientID,
      callbackURL,
    });

    // 실제 설정이 있는지 확인 (super() 호출 후)
    this.isConfigured = !!(
      configService.get<string>('oauth.kakao.clientId') ||
      process.env.KAKAO_CLIENT_ID
    );

    if (!this.isConfigured) {
      console.log(
        '⚠️  Kakao OAuth 설정이 없습니다. 소셜 로그인이 비활성화됩니다.',
      );
    } else {
      console.log('✅ Kakao OAuth 전략이 활성화되었습니다.');
    }
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: any,
  ): Promise<any> {
    if (!this.isConfigured) {
      return done(new Error('Kakao OAuth가 설정되지 않았습니다.'), false);
    }

    const { id, username, _json } = profile;

    const user = {
      providerId: String(id),
      provider: 'kakao',
      email: _json.kakao_account?.email,
      name: _json.properties?.nickname || username,
      profileImage: _json.properties?.profile_image,
    };

    done(null, user);
  }
}
