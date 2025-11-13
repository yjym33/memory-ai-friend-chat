import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-kakao';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class KakaoStrategy extends PassportStrategy(Strategy, 'kakao') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get<string>('oauth.kakao.clientId'),
      callbackURL: configService.get<string>('oauth.kakao.callbackUrl'),
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

