import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import {
  Strategy,
  VerifyCallback,
  StrategyOptions,
} from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private configService: ConfigService) {
    const clientID = configService.get<string>('oauth.google.clientId');
    const clientSecret = configService.get<string>(
      'oauth.google.clientSecret',
    );
    const callbackURL = configService.get<string>('oauth.google.callbackUrl');

    if (!clientID || !clientSecret || !callbackURL) {
      throw new Error('Google OAuth 설정이 누락되었습니다.');
    }

    const options: StrategyOptions = {
      clientID,
      clientSecret,
      callbackURL,
      scope: ['email', 'profile'],
    };

    super(options);
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { id, name, emails, photos } = profile;
    
    const user = {
      providerId: id,
      provider: 'google',
      email: emails[0].value,
      name: name.givenName + ' ' + name.familyName,
      profileImage: photos[0].value,
    };
    
    done(null, user);
  }
}

