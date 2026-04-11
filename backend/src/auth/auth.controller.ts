import {
  Controller,
  Get,
  Post,
  Body,
  Res,
  UseInterceptors,
  Req,
  UseGuards,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import type { Response, Request } from "express";
import { ResponseInterceptor } from "./interceptor/response.interceptor";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { UnauthorizedException } from "@nestjs/common";
@Controller("auth")
@UseInterceptors(ResponseInterceptor)
export class AuthController {
  constructor(private authService: AuthService) {}

@UseGuards(JwtAuthGuard)
  @Get("me")
  getMe(@Req() req) {
    return {
        user: req.user,
    };}
  //////////////////////////////////////////////////////
  // ✅ REGISTER
  //////////////////////////////////////////////////////
  @Post("register")
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  //////////////////////////////////////////////////////
  // ✅ LOGIN (ACCESS + REFRESH TOKENS)
  //////////////////////////////////////////////////////
@Post("login")
async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res) {
  const { accessToken, refreshToken } =
    await this.authService.login(dto);

  res.cookie("accessToken", accessToken, {
  httpOnly: true,
  sameSite: "lax",
  secure: false,
  maxAge: 15 * 60 * 1000, // 15 mins
});

res.cookie("refreshToken", refreshToken, {
  httpOnly: true,
  sameSite: "lax",
  secure: false,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});

  return { message: "Login success" };
}

  //////////////////////////////////////////////////////
  // 🔄 REFRESH TOKEN
  //////////////////////////////////////////////////////
  @Post("refresh")
async refresh(@Req() req, @Res({ passthrough: true }) res) {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    throw new UnauthorizedException("No refresh token");
  }

  const { accessToken } =
    await this.authService.refreshToken(refreshToken);

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
  });

  return { message: "Token refreshed" };
}

  //////////////////////////////////////////////////////
  // 🚪 LOGOUT
  //////////////////////////////////////////////////////
@Post("logout")
logout(@Res({ passthrough: true }) res) {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");

  return { message: "Logged out" };
}
}