import { UpdateUserDto } from '../../dto/update-user.dto';
import { IsEmail } from 'class-validator';

export class UpdateUserInputDto implements UpdateUserDto {
  @IsEmail()
  email: string;
}
