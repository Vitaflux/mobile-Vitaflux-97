import type { RequestStatus } from '../../common/constants';

const REQUEST_STATUS_TRANSITIONS: Record<
  RequestStatus,
  readonly RequestStatus[]
> = {
  registered: ['confirmed'],
  confirmed: ['done'],
  done: [],
};

export function canTransitionRequestStatus(
  currentStatus: RequestStatus,
  nextStatus: RequestStatus,
): boolean {
  return REQUEST_STATUS_TRANSITIONS[currentStatus].includes(nextStatus);
}
