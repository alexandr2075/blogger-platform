export class UpdateUserDto {
  email?: string;
  name?: {
    firstName?: string;
    lastName?: string;
  };
}
