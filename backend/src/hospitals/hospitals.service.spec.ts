import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ObjectId } from 'mongodb';
import { Blood } from '../bloods/entities/blood.model';
import { Request } from '../requests/entities/request.model';
import { UpdateHospitalDto } from './dto/update-hospital.dto';
import { Hospital } from './entities/hospital.model';
import { HospitalsService } from './hospitals.service';

describe('HospitalsService', () => {
  describe('done_today stats', () => {
    const now = new Date('2026-08-19T10:00:00.000Z');

    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(now);
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it.each([
      {
        caseName: 'counts a done request checked in today',
        request: {
          status: 'done',
          checked_in_at: new Date('2026-08-19T02:00:00.000Z'),
        },
        expectedDoneToday: 1,
        expectedTotalCollected: 1,
      },
      {
        caseName: 'does not count a done request checked in yesterday',
        request: {
          status: 'done',
          checked_in_at: new Date('2026-08-18T16:59:59.999Z'),
        },
        expectedDoneToday: 0,
        expectedTotalCollected: 1,
      },
      {
        caseName: 'does not count a confirmed request checked in today',
        request: {
          status: 'confirmed',
          checked_in_at: new Date('2026-08-19T02:00:00.000Z'),
        },
        expectedDoneToday: 0,
        expectedTotalCollected: 0,
      },
      {
        caseName: 'does not count a done request without checked_in_at',
        request: {
          status: 'done',
          checked_in_at: null,
        },
        expectedDoneToday: 0,
        expectedTotalCollected: 1,
      },
    ])(
      '$caseName',
      async ({ request, expectedDoneToday, expectedTotalCollected }) => {
        const userId = new ObjectId();
        const hospitalId = new ObjectId();
        const bloodId = new ObjectId();
        const hospital = {
          _id: hospitalId,
          user_id: userId,
          hospital_name: 'RS Vitaflux',
          location: {
            type: 'Point' as const,
            coordinates: [107.6191, -6.9175] as [number, number],
          },
          isVerified: true,
        };
        const hospitalModel = {
          where: jest.fn(() => ({
            first: jest.fn().mockResolvedValue(hospital),
          })),
        };
        const bloodModel = {
          where: jest.fn(() => ({
            get: jest.fn().mockResolvedValue([{ _id: bloodId }]),
          })),
        };
        const requestModel = {
          where: jest.fn(() => ({
            get: jest.fn().mockResolvedValue([request]),
          })),
        };
        const service = new HospitalsService(
          hospitalModel as unknown as Hospital,
          bloodModel as unknown as Blood,
          requestModel as unknown as Request,
        );

        const result = await service.getForFacility(userId.toString());

        expect(result.data.stats.done_today).toBe(expectedDoneToday);
        expect(result.data.stats.total_collected).toBe(expectedTotalCollected);
      },
    );
  });

  it('updates only the allowed metadata for the authenticated facility', async () => {
    const userId = new ObjectId();
    const hospitalId = new ObjectId();
    const hospital = {
      _id: hospitalId,
      user_id: userId,
      hospital_name: 'RS Lama',
      location: {
        type: 'Point' as const,
        coordinates: [107.6191, -6.9175] as [number, number],
      },
      isVerified: false,
      code: null,
      address: null,
      unit_donor: null,
      pic_name: null,
      contact: null,
      hospital_type: null,
    };
    const update = jest.fn((metadata: Partial<typeof hospital>) => {
      Object.assign(hospital, metadata);

      return Promise.resolve();
    });
    const hospitalModel = {
      where: jest.fn((column: string) =>
        column === 'user_id'
          ? {
              first: jest
                .fn()
                .mockImplementation(() => Promise.resolve(hospital)),
            }
          : { update },
      ),
    };
    const bloodModel = {
      where: jest.fn(() => ({
        get: jest.fn().mockResolvedValue([]),
      })),
    };
    const service = new HospitalsService(
      hospitalModel as unknown as Hospital,
      bloodModel as unknown as Blood,
      {} as Request,
    );

    const result = await service.updateForFacility(userId.toString(), {
      hospital_name: 'RS Vitaflux',
      address: 'Jl. Merdeka 10',
      unit_donor: 'UDD Internal',
      pic_name: 'dr. Siti',
      contact: '022-1234567',
      hospital_type: 'RS Tipe A',
    });

    expect(update).toHaveBeenCalledWith({
      hospital_name: 'RS Vitaflux',
      address: 'Jl. Merdeka 10',
      unit_donor: 'UDD Internal',
      pic_name: 'dr. Siti',
      contact: '022-1234567',
      hospital_type: 'RS Tipe A',
    });
    expect(result.data).toEqual(
      expect.objectContaining({
        hospital_name: 'RS Vitaflux',
        address: 'Jl. Merdeka 10',
        isVerified: false,
        code: null,
      }),
    );
  });

  it('rejects isVerified as a non-whitelisted update field', async () => {
    const dto = plainToInstance(UpdateHospitalDto, {
      address: 'Jl. Merdeka 10',
      isVerified: true,
    });

    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          property: 'isVerified',
        }),
      ]),
    );
  });
});
