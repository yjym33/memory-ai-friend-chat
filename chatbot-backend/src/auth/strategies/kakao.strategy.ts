import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-kakao';
import { ConfigService } from '@nestjs/config';
import { OAuthUser } from '../../common/types/request.types';

/**
 * 카카오 프로필 JSON 타입
 */
interface KakaoJson {
  kakao_account?: {
    email?: string;
  };
  properties?: {
    nickname?: string;
    profile_image?: string;
  };
}

/**
 * 카카오 프로필 확장 타입
 */
interface KakaoProfile extends Profile {
  _json: KakaoJson;
}

/**
 * Passport done 콜백 타입
 */
type DoneCallback = (error: Error | null, user?: OAuthUser | false) => void;

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
    profile: KakaoProfile,
    done: DoneCallback,
  ): Promise<void> {
    if (!this.isConfigured) {
      done(new Error('Kakao OAuth가 설정되지 않았습니다.'), false);
      return;
    }

    const { id, username, _json } = profile;

    const user: OAuthUser = {
      providerId: String(id),
      provider: 'kakao',
      email: _json.kakao_account?.email || '',
      name: _json.properties?.nickname || username || '',
      profileImage: _json.properties?.profile_image,
    };

    done(null, user);
  }
}
