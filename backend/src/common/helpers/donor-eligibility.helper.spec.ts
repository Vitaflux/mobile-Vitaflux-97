/// <reference types="jest" />

import { calculateDonorEligibility } from './donor-eligibility.helper';

describe('calculateDonorEligibility', () => {
  it('marks a donor without donation history as eligible', () => {
    const now = new Date('2026-08-15T00:00:00.000Z');

    const result = calculateDonorEligibility(null, now);

    expect(result).toEqual({
      isEligible: true,
      remainingDays: 0,
      eligibleAt: null,
    });
  });

  it('returns the remaining days before the eligibility date', () => {
    const lastDonor = new Date('2026-01-01T00:00:00.000Z');
    const now = new Date('2026-03-22T00:00:00.000Z');

    const result = calculateDonorEligibility(lastDonor, now);

    expect(result.isEligible).toBe(false);
    expect(result.remainingDays).toBe(10);
    expect(result.eligibleAt).toEqual(new Date('2026-04-01T00:00:00.000Z'));
  });

  it('rounds a partial remaining day upward', () => {
    const lastDonor = new Date('2026-01-01T00:00:00.000Z');
    const now = new Date('2026-03-31T12:00:00.000Z');

    const result = calculateDonorEligibility(lastDonor, now);

    expect(result.isEligible).toBe(false);
    expect(result.remainingDays).toBe(1);
  });

  it('marks a donor as eligible exactly after 90 days', () => {
    const lastDonor = new Date('2026-01-01T00:00:00.000Z');
    const now = new Date('2026-04-01T00:00:00.000Z');

    const result = calculateDonorEligibility(lastDonor, now);

    expect(result.isEligible).toBe(true);
    expect(result.remainingDays).toBe(0);
    expect(result.eligibleAt).toEqual(new Date('2026-04-01T00:00:00.000Z'));
  });

  it('marks a donor as eligible after more than 90 days', () => {
    const lastDonor = new Date('2026-01-01T00:00:00.000Z');
    const now = new Date('2026-04-02T00:00:00.000Z');

    const result = calculateDonorEligibility(lastDonor, now);

    expect(result.isEligible).toBe(true);
    expect(result.remainingDays).toBe(0);
  });
});
