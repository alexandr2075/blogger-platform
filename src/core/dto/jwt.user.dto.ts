import { IsNumber, IsString } from 'class-validator';

export class JwtUser {
  @IsString()
  sub: string;

  @IsNumber()
  iat: number;

  @IsNumber()
  exp: number;
}
