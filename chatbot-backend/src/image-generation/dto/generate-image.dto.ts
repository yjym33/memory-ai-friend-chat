import { IsString, IsOptional, IsNumber, IsIn, Min, Max } from 'class-validator';
import { ImageSize, ImageQuality, ImageStyle } from '../types/image.types';

/**
 * 이미지 생성 요청 DTO
 */
export class GenerateImageDto {
  @IsString()
  prompt: string;

  @IsOptional()
  @IsString()
  negativePrompt?: string;

  @IsOptional()
  @IsIn(['256x256', '512x512', '768x768', '1024x1024', '1792x1024', '1024x1792'])
  size?: ImageSize;

  @IsOptional()
  @IsIn(['standard', 'hd'])
  quality?: ImageQuality;

  @IsOptional()
  @IsIn(['vivid', 'natural'])
  style?: ImageStyle;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(4)
  n?: number;
}

/**
 * 이미지 Provider 설정 DTO
 */
export class UpdateImageSettingsDto {
  @IsOptional()
  @IsIn(['dalle', 'stability'])
  imageProvider?: string;

  @IsOptional()
  @IsString()
  imageModel?: string;

  @IsOptional()
  @IsIn(['256x256', '512x512', '768x768', '1024x1024', '1792x1024', '1024x1792'])
  defaultSize?: ImageSize;

  @IsOptional()
  @IsIn(['standard', 'hd'])
  defaultQuality?: ImageQuality;

  @IsOptional()
  @IsIn(['vivid', 'natural'])
  defaultStyle?: ImageStyle;
}

