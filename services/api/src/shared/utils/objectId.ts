/**
 * Helper to check if a string is a valid 24-character Mongo ObjectId
 */
export function isValidMongoObjectId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

/**
 * Returns a valid Mongo ObjectId string or a deterministic valid default fallback ObjectId
 */
export function toValidMongoObjectId(id: string): string {
  if (isValidMongoObjectId(id)) {
    return id;
  }
  // Deterministic valid 24-hex ObjectId fallback for dev/demo mode
  return '60d5ecf9c73e8e2b8c8b4567';
}
