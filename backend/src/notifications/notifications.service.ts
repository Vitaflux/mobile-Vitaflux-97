import { InjectModel } from '@mongoloquent/nestjs';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Expo } from 'expo-server-sdk';
import type { ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';
import { ObjectId } from 'mongodb';
import type { BloodType, RhesusType } from '../common/constants';
import {
  ELIGIBILITY_REMINDER_DAYS,
  URGENT_PUSH_RADIUS_METERS,
} from '../common/constants';
import { calculateDonorEligibility } from '../common/helpers/donor-eligibility.helper';
import { calculateDistanceKm } from '../common/helpers/geo-distance.helper';
import type { GeoPoint } from '../common/interfaces/geo-point.interface';
import { UserProfile } from '../profiles/entities/user-profile.model';

interface UrgentBloodNotification {
  bloodId: string;
  bloodType: BloodType;
  rhesus: RhesusType;
  hospitalName: string;
  hospitalLocation: GeoPoint;
}

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly expo = new Expo();

  constructor(
    @InjectModel(UserProfile)
    private readonly userProfileModel: typeof UserProfile,
  ) {}

  async onModuleInit() {
    const userProfileCollection = this.userProfileModel
      .query()
      .getMongoDBCollection();

    await userProfileCollection.createIndex({
      location: '2dsphere',
    });
  }

  async updatePushTokenForDonor(userId: string, pushToken: string | null) {
    if (!ObjectId.isValid(userId)) {
      throw new UnauthorizedException('Invalid authenticated user');
    }

    if (pushToken !== null && !Expo.isExpoPushToken(pushToken)) {
      throw new BadRequestException('Invalid Expo push token');
    }

    const profile = await this.userProfileModel
      .where('user_id', new ObjectId(userId))
      .first();

    if (!profile) {
      throw new NotFoundException('Donor profile was not found for this user');
    }

    await this.userProfileModel.where('_id', profile._id).update({
      push_token: pushToken,
    });

    return {
      success: true,
      data: {
        user_Profiles_id: profile._id.toString(),
        push_token: pushToken,
      },
    };
  }

  async sendUrgentBloodNotification(notification: UrgentBloodNotification) {
    const userProfileCollection = this.userProfileModel
      .query()
      .getMongoDBCollection();

    const nearbyProfiles = await userProfileCollection
      .find({
        blood_type: notification.bloodType,
        rhesus: notification.rhesus,
        push_token: {
          $type: 'string',
          $ne: '',
        },
        location: {
          $near: {
            $geometry: notification.hospitalLocation,
            $maxDistance: URGENT_PUSH_RADIUS_METERS,
          },
        },
      })
      .toArray();

    const messages = nearbyProfiles.flatMap((profile): ExpoPushMessage[] => {
      const eligibility = calculateDonorEligibility(profile.last_donor ?? null);
      const pushToken = profile.push_token;
      const effectiveRadiusKm =
        profile.notify_radius_km ?? URGENT_PUSH_RADIUS_METERS / 1000;
      const distanceKm = calculateDistanceKm(
        notification.hospitalLocation,
        profile.location,
      );

      if (
        !eligibility.isEligible ||
        !Expo.isExpoPushToken(pushToken) ||
        distanceKm > effectiveRadiusKm
      ) {
        return [];
      }

      return [
        {
          to: pushToken,
          sound: 'default',
          title: 'Kebutuhan Darah Mendesak',
          body: `${notification.hospitalName} membutuhkan donor ${notification.bloodType}${notification.rhesus}`,
          data: {
            bloods_id: notification.bloodId,
            type: 'urgent_blood_request',
          },
        },
      ];
    });

    if (messages.length === 0) {
      return {
        matched_donors: 0,
        tickets: [],
      };
    }

    const chunks = this.expo.chunkPushNotifications(messages);
    const tickets: ExpoPushTicket[] = [];

    for (const chunk of chunks) {
      const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);

      tickets.push(...ticketChunk);
    }

    return {
      matched_donors: messages.length,
      tickets,
    };
  }

  async sendEligibilityReminderNotifications(now: Date = new Date()) {
    const userProfileCollection = this.userProfileModel
      .query()
      .getMongoDBCollection();

    const profiles = await userProfileCollection
      .find({
        last_donor: {
          $type: 'date',
        },
        push_token: {
          $type: 'string',
          $ne: '',
        },
      })
      .toArray();

    const messages = profiles.flatMap((profile): ExpoPushMessage[] => {
      const eligibility = calculateDonorEligibility(
        profile.last_donor ?? null,
        now,
      );
      const pushToken = profile.push_token;

      if (
        eligibility.remainingDays !== ELIGIBILITY_REMINDER_DAYS ||
        !Expo.isExpoPushToken(pushToken)
      ) {
        return [];
      }

      return [
        {
          to: pushToken,
          sound: 'default',
          title: 'Pengingat Donor',
          body: '3 hari lagi kamu sudah boleh donor kembali',
          data: {
            type: 'donor_eligibility_reminder',
            eligible_at: eligibility.eligibleAt?.toISOString() ?? null,
          },
        },
      ];
    });

    if (messages.length === 0) {
      return {
        reminded_donors: 0,
        tickets: [],
      };
    }

    const chunks = this.expo.chunkPushNotifications(messages);
    const tickets: ExpoPushTicket[] = [];

    for (const chunk of chunks) {
      const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);

      tickets.push(...ticketChunk);
    }

    return {
      reminded_donors: messages.length,
      tickets,
    };
  }

  @Cron('0 0 9 * * *', {
    name: 'donor-eligibility-reminder',
    timeZone: 'Asia/Jakarta',
    waitForCompletion: true,
  })
  async handleEligibilityReminderCron() {
    const result = await this.sendEligibilityReminderNotifications();

    this.logger.log(
      `Eligibility reminder processed for ${result.reminded_donors} donor(s)`,
    );
  }
}
