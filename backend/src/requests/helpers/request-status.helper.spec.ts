import { canTransitionRequestStatus } from './request-status.helper';

describe('canTransitionRequestStatus', () => {
  it('allows registered to transition to confirmed', () => {
    expect(canTransitionRequestStatus('registered', 'confirmed')).toBe(true);
  });

  it('allows confirmed to transition to done', () => {
    expect(canTransitionRequestStatus('confirmed', 'done')).toBe(true);
  });

  it('rejects registered to transition directly to done', () => {
    expect(canTransitionRequestStatus('registered', 'done')).toBe(false);
  });

  it('rejects confirmed to transition back to registered', () => {
    expect(canTransitionRequestStatus('confirmed', 'registered')).toBe(false);
  });

  it('rejects done to transition back to confirmed', () => {
    expect(canTransitionRequestStatus('done', 'confirmed')).toBe(false);
  });

  it('rejects transition to the same status', () => {
    expect(canTransitionRequestStatus('registered', 'registered')).toBe(false);
    expect(canTransitionRequestStatus('confirmed', 'confirmed')).toBe(false);
    expect(canTransitionRequestStatus('done', 'done')).toBe(false);
  });
});
