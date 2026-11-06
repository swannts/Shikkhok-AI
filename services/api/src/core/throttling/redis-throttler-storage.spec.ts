import Redis from 'ioredis';
import { RedisThrottlerStorage } from './redis-throttler-storage';

describe('RedisThrottlerStorage', () => {
  it('uses an atomic Redis script and returns the throttler storage record', async () => {
    const evalScript = jest.fn().mockResolvedValue([4, 1200, 1, 5000]);
    const storage = new RedisThrottlerStorage({ eval: evalScript } as unknown as Redis);

    await expect(storage.increment('user:ip', 60000, 3, 5000, 'default')).resolves.toEqual({
      totalHits: 4,
      timeToExpire: 1200,
      isBlocked: true,
      timeToBlockExpire: 5000,
    });
    expect(evalScript).toHaveBeenCalledWith(
      expect.stringContaining("redis.call('INCR', KEYS[1])"),
      2,
      expect.stringMatching(/^shikkhok:rate-limit:\{[a-f0-9]{64}\}:hits$/),
      expect.stringMatching(/^shikkhok:rate-limit:\{[a-f0-9]{64}\}:blocked$/),
      60000,
      3,
      5000,
    );
  });
});
