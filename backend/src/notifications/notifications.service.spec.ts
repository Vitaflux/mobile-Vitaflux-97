import 'reflect-metadata';
import type { ExpoPushMessage } from 'expo-server-sdk';
import { ObjectId } from 'mongodb';
import { UserProfile } from '../profiles/entities/user-profile.model';
import { NotificationsService } from './notifications.service';

const mockChunkPushNotifications = jest.fn((messages: ExpoPushMessage[]) => [
  messages,
]);
const mockSendPushNotificationsAsync = jest
  .fn()
  .mockResolvedValue([{ status: 'ok', id: 'ticket-id' }]);

jest.mock('expo-server-sdk', () => ({
  Expo: class MockExpo {
    static isExpoPushToken(token: unknown) {
      return (
        typeof token === 'string' &&
        /^(ExponentPushToken|ExpoPushToken)\[[A-Za-z0-9_-]+\]$/.test(token)
      );
    }

    chunkPushNotifications = mockChunkPushNotifications;
    sendPushNotificationsAsync = mockSendPushNotificationsAsync;
  },
}));

describe('NotificationsService', () => {
  const validPushToken = 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]';
  const createIndex = jest.fn().mockResolvedValue('location_2dsphere');
  const toArray = jest.fn();
  const find = jest.fn(() => ({ toArray }));
  const collection = { createIndex, find };
  const userProfileModel = {
    query: jest.fn(() => ({
      getMongoDBCollection: jest.fn(() => collection),
    })),
    where: jest.fn(() => ({
      first: jest.fn().mockResolvedValue({ push_token: validPushToken }),
    })),
  };

  let service: NotificationsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new NotificationsService(
      userProfileModel as unknown as typeof UserProfile,
    );
  });

  it('sends urgent notifications to an eligible matching donor', async () => {
    toArray.mockResolvedValue([
      {
        push_token: validPushToken,
        last_donor: null,
      },
    ]);

    const result = await service.sendUrgentBloodNotification({
      bloodId: 'blood-id',
      bloodType: 'O',
      rhesus: '+',
      hospitalName: 'RS Vitaflux',
      hospitalLocation: {
        type: 'Point',
        coordinates: [106.8456, -6.2088],
      },
    });

    expect(find).toHaveBeenCalledWith({
      blood_type: 'O',
      rhesus: '+',
      push_token: {
        $type: 'string',
        $ne: '',
      },
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [106.8456, -6.2088],
          },
          $maxDistance: 20000,
        },
      },
    });
    expect(mockChunkPushNotifications).toHaveBeenCalledWith([
      expect.objectContaining({
        to: validPushToken,
        data: {
          bloods_id: 'blood-id',
          type: 'urgent_blood_request',
        },
      }),
    ]);
    expect(mockSendPushNotificationsAsync).toHaveBeenCalledTimes(1);
    expect(result.matched_donors).toBe(1);
  });

  it('notifies the donor when a facility confirms the registration', async () => {
    const result = await service.sendDonorConfirmationNotification({
      userProfileId: new ObjectId(),
      hospitalName: 'RS Vitaflux',
      schedule: new Date('2026-08-21T02:00:00.000Z'),
    });

    expect(mockSendPushNotificationsAsync).toHaveBeenCalledWith([
      expect.objectContaining({
        to: validPushToken,
        title: 'Pendaftaran donor dikonfirmasi',
        data: expect.objectContaining({
          type: 'donor_request_confirmed',
          schedule: '2026-08-21T02:00:00.000Z',
        }),
      }),
    ]);
    expect(mockSendPushNotificationsAsync).toHaveBeenCalledTimes(1);
    expect(result.sent).toBe(true);
  });
});
