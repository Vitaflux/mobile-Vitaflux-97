import {
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
  Get,
  Param,
  Patch,
} from '@nestjs/common';
import type { Request } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { BloodsService } from './bloods.service';
import { CreateBloodDto } from './dto/create-blood.dto';
import { BloodIdParamDto } from './dto/blood-id-param.dto';

interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

@Controller('bloods')
export class BloodsController {
  constructor(private readonly bloodsService: BloodsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('facility')
  create(
    @Req() request: AuthenticatedRequest,
    @Body() createBloodDto: CreateBloodDto,
  ) {
    return this.bloodsService.createForFacility(
      request.user.userId,
      createBloodDto,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('facility')
  findAll(@Req() request: AuthenticatedRequest) {
    return this.bloodsService.findAllForFacility(request.user.userId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('facility')
  findOne(
    @Req() request: AuthenticatedRequest,
    @Param() params: BloodIdParamDto,
  ) {
    return this.bloodsService.findOneForFacility(
      request.user.userId,
      params.id,
    );
  }

  @Patch(':id/close')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('facility')
  close(
    @Req() request: AuthenticatedRequest,
    @Param() params: BloodIdParamDto,
  ) {
    return this.bloodsService.closeForFacility(request.user.userId, params.id);
  }
}
