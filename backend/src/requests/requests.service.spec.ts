import { BadRequestException } from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { Blood } from '../bloods/entities/blood.model';
import { Hospital } from '../hospitals/entities/hospital.model';
import { UserProfile } from '../profiles/entities/user-profile.model';
import { User } from '../users/entities/user.model';
import { Request } from './entities/request.model';
import { RequestsService } from './requests.service';

describe('RequestsService check-in schedule validation', () => {
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
    );

    return { service, update };
  }

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(now);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('rejects check-in before the donation schedule starts', async () => {
    const { service, update } = createService(
      new Date('2026-08-18T09:00:00.000Z'),
      new Date('2026-08-18T15:00:00.000Z'),
    );

    await expect(
      service.checkInForFacility(userId.toString(), qrToken, 350),
    ).rejects.toThrow(
      new BadRequestException(
        'QR cannot be used because the donation schedule has not started',
      ),
    );

    expect(update).not.toHaveBeenCalled();
  });

  it('rejects check-in after the donation schedule ends', async () => {
    const { service, update } = createService(
      new Date('2026-08-18T01:00:00.000Z'),
      new Date('2026-08-18T07:00:00.000Z'),
    );

    await expect(
      service.checkInForFacility(userId.toString(), qrToken, 350),
    ).rejects.toThrow(new BadRequestException('QR/schedule has expired'));

    expect(update).not.toHaveBeenCalled();
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
});
