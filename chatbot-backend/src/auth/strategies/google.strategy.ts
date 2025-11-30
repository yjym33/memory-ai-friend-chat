import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import {
  Strategy,
  VerifyCallback,
  StrategyOptions,
  Profile,
} from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { OAuthUser } from '../../common/types/request.types';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private isConfigured: boolean;

  constructor(private configService: ConfigService) {
    const clientID =
      configService.get<string>('oauth.google.clientId') ||
      process.env.GOOGLE_CLIENT_ID ||
      'dummy-client-id';
    const clientSecret =
      configService.get<string>('oauth.google.clientSecret') ||
      process.env.GOOGLE_CLIENT_SECRET ||
      'dummy-client-secret';
    const callbackURL =
      configService.get<string>('oauth.google.callbackUrl') ||
      process.env.GOOGLE_CALLBACK_URL ||
      'http://localhost:8080/auth/google/callback';

    const options: StrategyOptions = {
      clientID,
      clientSecret,
      callbackURL,
      scope: ['email', 'profile'],
    };

    super(options);

    // 실제 설정이 있는지 확인 (super() 호출 후)
    this.isConfigured = !!(
      configService.get<string>('oauth.google.clientId') ||
      process.env.GOOGLE_CLIENT_ID
    );

    if (!this.isConfigured) {
      console.log(
        '⚠️  Google OAuth 설정이 없습니다. 소셜 로그인이 비활성화됩니다.',
      );
    } else {
      console.log('✅ Google OAuth 전략이 활성화되었습니다.');
    }
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<void> {
    if (!this.isConfigured) {
      done(new Error('Google OAuth가 설정되지 않았습니다.'), undefined);
      return;
    }

    const { id, name, emails, photos } = profile;

    const user: OAuthUser = {
      providerId: id,
      provider: 'google',
      email: emails?.[0]?.value || '',
      name: (name?.givenName || '') + ' ' + (name?.familyName || ''),
      profileImage: photos?.[0]?.value,
    };

    done(null, user);
  }
}
