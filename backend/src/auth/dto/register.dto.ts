import { IsEmail, MinLength, IsString } from "class-validator";

export class RegisterDto {
  @IsString()
  name: string; // ✅ added

  @IsEmail()
  email: string;

  @MinLength(6)
  password: string;
}