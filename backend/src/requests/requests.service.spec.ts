import { BadRequestException } from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { Blood } from '../bloods/entities/blood.model';
import { Hospital } from '../hospitals/entities/hospital.model';
import { UserProfile } from '../profiles/entities/user-profile.model';
import { User } from '../users/entities/user.model';
import { Request } from './entities/request.model';
import { RequestsService } from './requests.service';
import { NotificationsService } from '../notifications/notifications.service';

jest.mock('../notifications/notifications.service', () => ({
  NotificationsService: class NotificationsService {},
}));

describe('RequestsService check-in flow', () => {
  const now = new Date('2026-08-18T08:00:00.000Z');
  const userId = new ObjectId();
  const hospitalId = new ObjectId();
  const bloodId = new ObjectId();
  const requestId = new ObjectId();
  const profileId = new ObjectId();
  const qrToken = '5ae7254f-f2c2-4a3c-8971-f6b7a038fe34';

  function createService(schedule: Date, scheduleEnd: Date | null) {
    const hospital = {
      _id: hospitalId,
      user_id: userId,
    };

    const donorRequest = {
      _id: requestId,
      bloods_id: bloodId,
      user_Profiles_id: profileId,
      screenings: {
        screeningPassed: true,
        screeningAnswers: {},
      },
      status: 'confirmed' as const,
      qr_token: qrToken,
      code: 'VF-8241',
      checked_in_at: null,
      volume_ml: null,
    };

    const blood = {
      _id: bloodId,
      hospitals_id: hospitalId,
      schedule,
      schedule_end: scheduleEnd,
    };

    const update = jest.fn().mockResolvedValue(undefined);

    const requestModel = {
      where: jest.fn((column: string) =>
        column === '_id'
          ? { update }
          : { first: jest.fn().mockResolvedValue(donorRequest) },
      ),
    };

    const bloodModel = {
      where: jest.fn(() => ({
        first: jest.fn().mockResolvedValue(blood),
      })),
    };

    const hospitalModel = {
      where: jest.fn(() => ({
        first: jest.fn().mockResolvedValue(hospital),
      })),
    };

    const service = new RequestsService(
      requestModel as unknown as Request,
      bloodModel as unknown as Blood,
      {} as UserProfile,
      hospitalModel as unknown as Hospital,
      {} as User,
      {
        sendDonorConfirmationNotification: jest.fn(),
      } as unknown as NotificationsService,
    );

    return { service, update, requestModel };
  }

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(now);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('allows a confirmed donor to check in before the planned start time', async () => {
    const { service, update } = createService(
      new Date('2026-08-18T09:00:00.000Z'),
      new Date('2026-08-18T15:00:00.000Z'),
    );

    const result = await service.checkInForFacility(
      userId.toString(),
      qrToken,
      350,
    );

    expect(result.data.status).toBe('done');
    expect(update).toHaveBeenCalledWith({
      status: 'done',
      checked_in_at: now,
      volume_ml: 350,
    });
  });

  it('allows a confirmed donor to finish after the planned end time', async () => {
    const { service, update } = createService(
      new Date('2026-08-18T01:00:00.000Z'),
      new Date('2026-08-18T07:00:00.000Z'),
    );

    const result = await service.checkInForFacility(
      userId.toString(),
      qrToken,
      350,
    );

    expect(result.data.status).toBe('done');
    expect(update).toHaveBeenCalledWith({
      status: 'done',
      checked_in_at: now,
      volume_ml: 350,
    });
  });

  it('completes check-in during the active donation schedule', async () => {
    const { service, update } = createService(
      new Date('2026-08-18T07:00:00.000Z'),
      new Date('2026-08-18T09:00:00.000Z'),
    );

    const result = await service.checkInForFacility(
      userId.toString(),
      qrToken,
      350,
    );

    expect(result.data.status).toBe('done');
    expect(result.data.checked_in_at).toEqual(now);
    expect(update).toHaveBeenCalledWith({
      status: 'done',
      checked_in_at: now,
      volume_ml: 350,
    });
  });

  it('finds and completes check-in using a manual code', async () => {
    const { service, requestModel } = createService(
      new Date('2026-08-18T07:00:00.000Z'),
      new Date('2026-08-18T09:00:00.000Z'),
    );

    const result = await service.checkInForFacility(
      userId.toString(),
      undefined,
      350,
      'VF-8241',
    );

    expect(requestModel.where).toHaveBeenNthCalledWith(1, 'code', 'VF-8241');
    expect(result.data.status).toBe('done');
  });

  it('rejects check-in without a QR token or manual code', async () => {
    const { service } = createService(
      new Date('2026-08-18T07:00:00.000Z'),
      new Date('2026-08-18T09:00:00.000Z'),
    );

    await expect(service.checkInForFacility(userId.toString())).rejects.toThrow(
      new BadRequestException('QR token or code is required'),
    );
  });
});
