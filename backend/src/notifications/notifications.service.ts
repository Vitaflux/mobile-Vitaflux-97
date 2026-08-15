import { InjectModel } from '@mongoloquent/nestjs';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { Expo } from 'expo-server-sdk';
import type { ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';
import { ObjectId } from 'mongodb';
import type { BloodType, RhesusType } from '../common/constants';
import { URGENT_PUSH_RADIUS_METERS } from '../common/constants';
import { calculateDonorEligibility } from '../common/helpers/donor-eligibility.helper';
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

  async updatePushTokenForDonor(userId: string, pushToken: string) {
    if (!ObjectId.isValid(userId)) {
      throw new UnauthorizedException('Invalid authenticated user');
    }

    if (!Expo.isExpoPushToken(pushToken)) {
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

      if (!eligibility.isEligible || !Expo.isExpoPushToken(pushToken)) {
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
}
