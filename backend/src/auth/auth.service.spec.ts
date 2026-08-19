import { JwtService } from '@nestjs/jwt';
import { ObjectId } from 'mongodb';
import { Hospital } from '../hospitals/entities/hospital.model';
import { User } from '../users/entities/user.model';
import { AuthService } from './auth.service';

describe('AuthService registration', () => {
  function createService() {
    const userModel = {
      where: jest.fn(() => ({
        first: jest.fn().mockResolvedValue(null),
      })),
      insert: jest.fn((input: Record<string, unknown>) =>
        Promise.resolve({
          _id: new ObjectId(),
          ...input,
        }),
      ),
    };

    const hospitalModel = {
      insert: jest.fn((input: Record<string, unknown>) =>
        Promise.resolve({
          _id: new ObjectId(),
          ...input,
        }),
      ),
    };

    const jwtService = {
      signAsync: jest.fn(),
    };

    const service = new AuthService(
      userModel as unknown as User,
      hospitalModel as unknown as Hospital,
      jwtService as unknown as JwtService,
    );

    return { service, hospitalModel };
  }

  it('creates an unverified hospital for a facility registration', async () => {
    const { service, hospitalModel } = createService();
    const location = {
      type: 'Point' as const,
      coordinates: [107.6191, -6.9175] as [number, number],
    };

    const result = await service.register({
      name: 'RS Vitaflux',
      email: 'facility@vitaflux.test',
      password: 'Demo12345!',
      role: 'facility',
      location,
    });

    const hospitalInput = hospitalModel.insert.mock.calls[0]?.[0] as {
      user_id: ObjectId;
      hospital_name: string;
      location: typeof location;
      isVerified: boolean;
    };

    expect(hospitalInput.user_id).toBeInstanceOf(ObjectId);
    expect(hospitalInput.hospital_name).toBe('RS Vitaflux');
    expect(hospitalInput.location).toEqual(location);
    expect(hospitalInput.isVerified).toBe(false);
    expect(result.data.role).toBe('facility');
  });

  it('does not create a hospital for a donor registration', async () => {
    const { service, hospitalModel } = createService();

    await service.register({
      name: 'Donor Vitaflux',
      email: 'donor@vitaflux.test',
      password: 'Demo12345!',
      role: 'donor',
    });

    expect(hospitalModel.insert).not.toHaveBeenCalled();
  });
});
