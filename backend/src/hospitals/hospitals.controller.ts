import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { HospitalsService } from './hospitals.service';
import { UpdateHospitalProfileDto } from './dto/update-hospital-profile.dto';

interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

@Controller('hospitals')
export class HospitalsController {
  constructor(private readonly hospitalsService: HospitalsService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('facility')
  getMine(@Req() request: AuthenticatedRequest) {
    return this.hospitalsService.getForFacility(request.user.userId);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('facility')
  updateMine(
    @Req() request: AuthenticatedRequest,
    @Body() updateHospitalProfileDto: UpdateHospitalProfileDto,
  ) {
    return this.hospitalsService.updateForFacility(
      request.user.userId,
      updateHospitalProfileDto,
    );
  }
}
