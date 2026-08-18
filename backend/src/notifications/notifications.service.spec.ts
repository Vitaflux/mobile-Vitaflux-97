import 'reflect-metadata';
import type { ExpoPushMessage } from 'expo-server-sdk';
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

  it('sends eligibility reminders only to donors at H-3', async () => {
    toArray.mockResolvedValue([
      {
        push_token: validPushToken,
        last_donor: new Date('2026-05-23T00:00:00.000Z'),
      },
      {
        push_token: 'invalid-token',
        last_donor: new Date('2026-05-23T00:00:00.000Z'),
      },
      {
        push_token: 'ExponentPushToken[yyyyyyyyyyyyyyyyyyyyyy]',
        last_donor: new Date('2026-05-22T00:00:00.000Z'),
      },
    ]);

    const result = await service.sendEligibilityReminderNotifications(
      new Date('2026-08-18T00:00:00.000Z'),
    );

    expect(mockChunkPushNotifications).toHaveBeenCalledWith([
      expect.objectContaining({
        to: validPushToken,
        body: '3 hari lagi kamu sudah boleh donor kembali',
        data: {
          type: 'donor_eligibility_reminder',
          eligible_at: '2026-08-21T00:00:00.000Z',
        },
      }),
    ]);
    expect(mockSendPushNotificationsAsync).toHaveBeenCalledTimes(1);
    expect(result.reminded_donors).toBe(1);
  });
});
