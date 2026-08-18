import 'reflect-metadata';
import { validate } from 'class-validator';
import { CheckInRequestDto } from './check-in-request.dto';

describe('CheckInRequestDto', () => {
  async function validateDto(values: Partial<CheckInRequestDto>) {
    return validate(Object.assign(new CheckInRequestDto(), values));
  }

  it('accepts a valid manual code without a QR token', async () => {
    const errors = await validateDto({ code: 'VF-8241', volume_ml: 350 });

    expect(errors).toHaveLength(0);
  });

  it('rejects an invalid manual code format', async () => {
    const errors = await validateDto({ code: '8241' });

    expect(errors).not.toHaveLength(0);
  });

  it('rejects a body without a QR token or manual code', async () => {
    const errors = await validateDto({ volume_ml: 350 });

    expect(errors).not.toHaveLength(0);
  });
});
