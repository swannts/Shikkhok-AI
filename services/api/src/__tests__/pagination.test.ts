import { PaginationHelper } from '../shared/pagination.helper';

describe('PaginationHelper (Cursor-based Pagination)', () => {
  const sampleRecords = Array.from({ length: 25 }, (_, i) => ({
    id: `rec-${i + 1}`,
    name: `Record ${i + 1}`,
  }));

  it('paginates first page and returns nextCursor with hasMore = true', () => {
    const limit = 10;
    const page1Items = sampleRecords.slice(0, limit + 1); // Simulate fetching limit + 1
    const result = PaginationHelper.formatPaginatedResult(page1Items, limit);

    expect(result.items.length).toBe(10);
    expect(result.hasMore).toBe(true);
    expect(result.nextCursor).toBe('rec-10');
  });

  it('returns last page with nextCursor = null and hasMore = false', () => {
    const limit = 10;
    const page3Items = sampleRecords.slice(20); // 5 items remaining
    const result = PaginationHelper.formatPaginatedResult(page3Items, limit);

    expect(result.items.length).toBe(5);
    expect(result.hasMore).toBe(false);
    expect(result.nextCursor).toBeNull();
  });
});
