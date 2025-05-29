import {
  IsString,
  IsNumber,
  IsArray,
  IsOptional,
  IsObject,
} from 'class-validator';

export class CreateAiSettingsDto {
  @IsString()
  personalityType: string;

  @IsString()
  speechStyle: string;

  @IsNumber()
  emojiUsage: number;

  @IsOptional()
  @IsString()
  nickname?: string;

  @IsNumber()
  empathyLevel: number;

  @IsNumber()
  memoryRetentionDays: number;

  @IsObject()
  memoryPriorities: {
    personal: number;
    hobby: number;
    work: number;
    emotion: number;
  };

  @IsObject()
  userProfile: {
    interests: string[];
    currentGoals: string[];
    importantDates: { name: string; date: string }[];
  };

  @IsArray()
  avoidTopics: string[];
}

export class UpdateAiSettingsDto extends CreateAiSettingsDto {}
