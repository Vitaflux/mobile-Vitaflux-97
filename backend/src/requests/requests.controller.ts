import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
  Query,
} from '@nestjs/common';
import type { Request } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { CreateRequestDto } from './dto/create-request.dto';
import { RequestBloodParamDto } from './dto/request-blood-param.dto';
import { RequestIdParamDto } from './dto/request-id-param.dto';
import { CheckInRequestDto } from './dto/check-in-request.dto';
import { RequestsService } from './requests.service';
import { MyRequestsQueryDto } from './dto/my-requests-query.dto';

interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('donor')
  register(
    @Req() request: AuthenticatedRequest,
    @Body() createRequestDto: CreateRequestDto,
  ) {
    return this.requestsService.registerDonor(
      request.user.userId,
      createRequestDto,
    );
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('donor')
  findMine(
    @Req() request: AuthenticatedRequest,
    @Query() query: MyRequestsQueryDto,
  ) {
    return this.requestsService.findMineForDonor(
      request.user.userId,
      query.status,
    );
  }

  @Get('blood/:bloodId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('facility')
  findApplicants(
    @Req() request: AuthenticatedRequest,
    @Param() params: RequestBloodParamDto,
  ) {
    return this.requestsService.findApplicantsForFacility(
      request.user.userId,
      params.bloodId,
    );
  }

  @Patch(':id/confirm')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('facility')
  confirm(
    @Req() request: AuthenticatedRequest,
    @Param() params: RequestIdParamDto,
  ) {
    return this.requestsService.confirmForFacility(
      request.user.userId,
      params.id,
    );
  }

  @Patch('check-in')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('facility')
  checkIn(
    @Req() request: AuthenticatedRequest,
    @Body() checkInRequestDto: CheckInRequestDto,
  ) {
    return this.requestsService.checkInForFacility(
      request.user.userId,
      checkInRequestDto.qr_token,
      checkInRequestDto.volume_ml,
    );
  }
}
