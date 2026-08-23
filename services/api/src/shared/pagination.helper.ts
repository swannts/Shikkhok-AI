export interface CursorPaginationParams {
  cursor?: string; // ID of the last item from previous page
  limit?: number;  // Items per page (default: 20, max: 100)
}

export interface CursorPaginatedResult<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export class PaginationHelper {
  public static parseLimit(limit?: number, defaultLimit: number = 20, maxLimit: number = 100): number {
    if (!limit || isNaN(limit) || limit <= 0) return defaultLimit;
    return Math.min(limit, maxLimit);
  }

  /**
   * Universal helper for cursor-based pagination over Prisma models
   */
  public static buildCursorQuery(params: CursorPaginationParams) {
    const limit = this.parseLimit(params.limit);
    const cursor = params.cursor ? { id: params.cursor } : undefined;
    const skip = params.cursor ? 1 : 0; // Skip the cursor element itself

    return {
      take: limit + 1, // Fetch +1 to check if there are more records
      cursor,
      skip,
    };
  }

  public static formatPaginatedResult<T extends { id: string }>(
    items: T[],
    requestedLimit: number
  ): CursorPaginatedResult<T> {
    const limit = this.parseLimit(requestedLimit);
    const hasMore = items.length > limit;
    const paginatedItems = hasMore ? items.slice(0, limit) : items;
    const nextCursor = hasMore ? paginatedItems[paginatedItems.length - 1].id : null;

    return {
      items: paginatedItems,
      nextCursor,
      hasMore,
    };
  }
}
