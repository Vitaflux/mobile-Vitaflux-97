import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { UpdateDonorProfileDto } from './dto/update-donor-profile.dto';
import { ProfilesService } from './profiles.service';

interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('donor')
  getMyProfile(@Req() request: AuthenticatedRequest) {
    return this.profilesService.getForDonor(request.user.userId);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('donor')
  updateMyProfile(
    @Req() request: AuthenticatedRequest,
    @Body() updateDonorProfileDto: UpdateDonorProfileDto,
  ) {
    return this.profilesService.updateForDonor(
      request.user.userId,
      updateDonorProfileDto,
    );
  }
}
