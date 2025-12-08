import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, MaxLength, Matches } from 'class-validator';

export class SocialMediaDto {
  @ApiProperty({
    description: 'URL Facebook du vendeur',
    example: 'https://facebook.com/monboutique',
    required: false
  })
  @IsOptional()
  @IsString({ message: 'L\'URL Facebook doit être une chaîne de caractères' })
  @MaxLength(500, { message: 'L\'URL Facebook ne peut pas dépasser 500 caractères' })
  @Matches(/^(https?:\/\/)?(www\.)?(facebook\.com|fb\.com)\/.+$/, {
    message: 'L\'URL Facebook n\'est pas valide. Format attendu: https://facebook.com/votrepage'
  })
  facebook_url?: string;

  @ApiProperty({
    description: 'URL Instagram du vendeur',
    example: 'https://instagram.com/@monboutique',
    required: false
  })
  @IsOptional()
  @IsString({ message: 'L\'URL Instagram doit être une chaîne de caractères' })
  @MaxLength(500, { message: 'L\'URL Instagram ne peut pas dépasser 500 caractères' })
  @Matches(/^(https?:\/\/)?(www\.)?(instagram\.com|instagr\.am)\/.+$/, {
    message: 'L\'URL Instagram n\'est pas valide. Format attendu: https://instagram.com/@votrecompte'
  })
  instagram_url?: string;

  @ApiProperty({
    description: 'URL Twitter/X du vendeur',
    example: 'https://twitter.com/monboutique',
    required: false
  })
  @IsOptional()
  @IsString({ message: 'L\'URL Twitter doit être une chaîne de caractères' })
  @MaxLength(500, { message: 'L\'URL Twitter ne peut pas dépasser 500 caractères' })
  @Matches(/^(https?:\/\/)?(www\.)?(twitter\.com|x\.com)\/.+$/, {
    message: 'L\'URL Twitter n\'est pas valide. Format attendu: https://twitter.com/votrecompte'
  })
  twitter_url?: string;

  @ApiProperty({
    description: 'URL TikTok du vendeur',
    example: 'https://tiktok.com/@monboutique',
    required: false
  })
  @IsOptional()
  @IsString({ message: 'L\'URL TikTok doit être une chaîne de caractères' })
  @MaxLength(500, { message: 'L\'URL TikTok ne peut pas dépasser 500 caractères' })
  @Matches(/^(https?:\/\/)?(www\.)?tiktok\.com\/@.+$/, {
    message: 'L\'URL TikTok n\'est pas valide. Format attendu: https://tiktok.com/@votrecompte'
  })
  tiktok_url?: string;

  @ApiProperty({
    description: 'URL YouTube du vendeur',
    example: 'https://youtube.com/channel/monboutique',
    required: false
  })
  @IsOptional()
  @IsString({ message: 'L\'URL YouTube doit être une chaîne de caractères' })
  @MaxLength(500, { message: 'L\'URL YouTube ne peut pas dépasser 500 caractères' })
  @Matches(/^(https?:\/\/)?(www\.)?(youtube\.com\/(channel|c|user)\/.+|youtu\.be\/.+)$/, {
    message: 'L\'URL YouTube n\'est pas valide. Format attendu: https://youtube.com/channel/votrechaine'
  })
  youtube_url?: string;

  @ApiProperty({
    description: 'URL LinkedIn du vendeur',
    example: 'https://linkedin.com/in/monboutique',
    required: false
  })
  @IsOptional()
  @IsString({ message: 'L\'URL LinkedIn doit être une chaîne de caractères' })
  @MaxLength(500, { message: 'L\'URL LinkedIn ne peut pas dépasser 500 caractères' })
  @Matches(/^(https?:\/\/)?(www\.)?linkedin\.com\/(in|company)\/.+$/, {
    message: 'L\'URL LinkedIn n\'est pas valide. Format attendu: https://linkedin.com/in/votreprofil'
  })
  linkedin_url?: string;
}

export class UpdateSocialMediaDto {
  @ApiProperty({
    description: 'URL Facebook du vendeur',
    example: 'https://facebook.com/monboutique',
    required: false
  })
  @IsOptional()
  @IsString()
  facebook_url?: string;

  @ApiProperty({
    description: 'URL Instagram du vendeur',
    example: 'https://instagram.com/@monboutique',
    required: false
  })
  @IsOptional()
  @IsString()
  instagram_url?: string;

  @ApiProperty({
    description: 'URL Twitter/X du vendeur',
    example: 'https://twitter.com/monboutique',
    required: false
  })
  @IsOptional()
  @IsString()
  twitter_url?: string;

  @ApiProperty({
    description: 'URL TikTok du vendeur',
    example: 'https://tiktok.com/@monboutique',
    required: false
  })
  @IsOptional()
  @IsString()
  tiktok_url?: string;

  @ApiProperty({
    description: 'URL YouTube du vendeur',
    example: 'https://youtube.com/channel/monboutique',
    required: false
  })
  @IsOptional()
  @IsString()
  youtube_url?: string;

  @ApiProperty({
    description: 'URL LinkedIn du vendeur',
    example: 'https://linkedin.com/in/monboutique',
    required: false
  })
  @IsOptional()
  @IsString()
  linkedin_url?: string;
}

export class SocialMediaResponseDto {
  @ApiProperty({
    description: 'URL Facebook du vendeur',
    example: 'https://facebook.com/monboutique',
    required: false
  })
  facebook_url?: string;

  @ApiProperty({
    description: 'URL Instagram du vendeur',
    example: 'https://instagram.com/@monboutique',
    required: false
  })
  instagram_url?: string;

  @ApiProperty({
    description: 'URL Twitter/X du vendeur',
    example: 'https://twitter.com/monboutique',
    required: false
  })
  twitter_url?: string;

  @ApiProperty({
    description: 'URL TikTok du vendeur',
    example: 'https://tiktok.com/@monboutique',
    required: false
  })
  tiktok_url?: string;

  @ApiProperty({
    description: 'URL YouTube du vendeur',
    example: 'https://youtube.com/channel/monboutique',
    required: false
  })
  youtube_url?: string;

  @ApiProperty({
    description: 'URL LinkedIn du vendeur',
    example: 'https://linkedin.com/in/monboutique',
    required: false
  })
  linkedin_url?: string;
}