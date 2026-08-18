export const USER_ROLES = ['donor', 'facility'] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const BLOOD_TYPES = ['A', 'B', 'AB', 'O'] as const;

export type BloodType = (typeof BLOOD_TYPES)[number];

export const RHESUS_TYPES = ['+', '-'] as const;

export type RhesusType = (typeof RHESUS_TYPES)[number];

export const BLOOD_STATUSES = ['normal', 'urgent', 'closed'] as const;

export type BloodStatus = (typeof BLOOD_STATUSES)[number];

export const REQUEST_STATUSES = ['registered', 'confirmed', 'done'] as const;

export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const ELIGIBILITY_WINDOW_DAYS = 90;

export const URGENT_PUSH_RADIUS_METERS = 20000;

export const BLOOD_COMPONENTS = [
  'whole_blood',
  'plasma',
  'trombosit',
  'eritrosit',
] as const;

export type BloodComponent = (typeof BLOOD_COMPONENTS)[number];
