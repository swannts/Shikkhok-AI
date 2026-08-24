/**
 * User account status.
 * Controls whether a user can authenticate and access the platform.
 */
export enum UserStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  PENDING_VERIFICATION = 'pending_verification',
}
