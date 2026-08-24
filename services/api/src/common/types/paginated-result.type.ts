export interface PaginatedResult<T> {
  data: T[];
  meta: {
    nextCursor: string | null;
    hasNext: boolean;
  };
}
