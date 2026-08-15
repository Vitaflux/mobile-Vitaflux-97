import { Body, Controller, Patch, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { UpdatePushTokenDto } from './dto/update-push-token.dto';
import { NotificationsService } from './notifications.service';

interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Patch('push-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('donor')
  updatePushToken(
    @Req() request: AuthenticatedRequest,
    @Body() updatePushTokenDto: UpdatePushTokenDto,
  ) {
    return this.notificationsService.updatePushTokenForDonor(
      request.user.userId,
      updatePushTokenDto.push_token,
    );
  }
}
