import {
  Body,
  Controller,
  Get,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { HospitalsService } from './hospitals.service';
import { UpdateHospitalProfileDto } from './dto/update-hospital-profile.dto';
import { NearbyHospitalsQueryDto } from './dto/nearby-hospitals-query.dto';

interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

@Controller('hospitals')
export class HospitalsController {
  constructor(private readonly hospitalsService: HospitalsService) {}

  @Get('nearby')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('donor')
  getNearby(
    @Req() request: AuthenticatedRequest,
    @Query() query: NearbyHospitalsQueryDto,
  ) {
    return this.hospitalsService.findNearbyForDonor(
      request.user.userId,
      query.radius,
    );
  }

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
