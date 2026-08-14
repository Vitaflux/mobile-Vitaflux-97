import { ELIGIBILITY_WINDOW_DAYS } from '../constants';

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

export interface DonorEligibility {
  isEligible: boolean;
  remainingDays: number;
  eligibleAt: Date | null;
}

export function calculateDonorEligibility(
  lastDonor: Date | null,
  now: Date = new Date(),
): DonorEligibility {
  if (!lastDonor) {
    return {
      isEligible: true,
      remainingDays: 0,
      eligibleAt: null,
    };
  }

  const eligibleAt = new Date(lastDonor.getTime());

  eligibleAt.setUTCDate(eligibleAt.getUTCDate() + ELIGIBILITY_WINDOW_DAYS);

  const remainingMilliseconds = eligibleAt.getTime() - now.getTime();

  if (remainingMilliseconds <= 0) {
    return {
      isEligible: true,
      remainingDays: 0,
      eligibleAt,
    };
  }

  return {
    isEligible: false,
    remainingDays: Math.ceil(remainingMilliseconds / MILLISECONDS_PER_DAY),
    eligibleAt,
  };
}
