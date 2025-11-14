import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-kakao';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class KakaoStrategy extends PassportStrategy(Strategy, 'kakao') {
  constructor(private configService: ConfigService) {
    const clientID = configService.get<string>('oauth.kakao.clientId');
    const callbackURL = configService.get<string>('oauth.kakao.callbackUrl');

    if (!clientID || !callbackURL) {
      throw new Error('Kakao OAuth 설정이 누락되었습니다.');
    }

    super({
      clientID,
      callbackURL,
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: any,
  ): Promise<any> {
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

