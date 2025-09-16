import { IsEmail, IsString, MinLength, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  name: string;

  @IsString()
  gender: string;

  @IsNumber()
  @Transform(({ value }: { value: any }) => parseInt(value, 10))
  birthYear: number;
}
