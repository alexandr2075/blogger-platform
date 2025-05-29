import { ApiProperty } from '@nestjs/swagger';
import { IsJWT, IsNotEmpty } from 'class-validator';

export class TokensViewDto {
  @ApiProperty({
    description: 'JWT access token for authenticated requests',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
    required: true,
  })
  @IsJWT({ message: 'Invalid JWT format' })
  @IsNotEmpty({ message: 'Access token cannot be empty' })
  accessToken: string;

  @ApiProperty({
    description: 'JWT refresh token for token renewal',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
    required: true,
  })
  @IsJWT({ message: 'Invalid JWT format' })
  @IsNotEmpty({ message: 'Refresh token cannot be empty' })
  refreshToken: string;
}
