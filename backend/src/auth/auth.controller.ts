import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { GoogleLoginDto } from './dto/google-login.dto';
import { GoogleOnboardingDto } from './dto/google-onboarding.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('google')
  @HttpCode(HttpStatus.OK)
  googleLogin(@Body() googleLoginDto: GoogleLoginDto) {
    return this.authService.googleLogin(googleLoginDto.id_token);
  }

  @Post('google/onboarding')
  @HttpCode(HttpStatus.OK)
  googleOnboarding(@Body() googleOnboardingDto: GoogleOnboardingDto) {
    return this.authService.completeGoogleOnboarding(googleOnboardingDto);
  }
}
