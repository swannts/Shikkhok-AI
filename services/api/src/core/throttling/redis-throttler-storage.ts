import { createHash } from 'crypto';
import { ThrottlerStorage } from '@nestjs/throttler';
import Redis from 'ioredis';

interface ThrottlerStorageRecord {
  totalHits: number;
  timeToExpire: number;
  isBlocked: boolean;
  timeToBlockExpire: number;
}

const INCREMENT_SCRIPT = `
local blockedFor = redis.call('PTTL', KEYS[2])
if blockedFor > 0 then
  local remaining = redis.call('PTTL', KEYS[1])
  return { tonumber(ARGV[2]) + 1, math.max(remaining, 0), 1, blockedFor }
end
local hits = redis.call('INCR', KEYS[1])
if hits == 1 then redis.call('PEXPIRE', KEYS[1], ARGV[1]) end
local remaining = math.max(redis.call('PTTL', KEYS[1]), 0)
if hits > tonumber(ARGV[2]) then
  redis.call('PSETEX', KEYS[2], ARGV[3], '1')
  return { hits, remaining, 1, tonumber(ARGV[3]) }
end
return { hits, remaining, 0, 0 }
`;

export class RedisThrottlerStorage implements ThrottlerStorage {
  constructor(private readonly redis: Redis) {}

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    const digest = createHash('sha256').update(`${throttlerName}:${key}`).digest('hex');
    const baseKey = `shikkhok:rate-limit:{${digest}}`;
    const result = (await this.redis.eval(
      INCREMENT_SCRIPT,
      2,
      `${baseKey}:hits`,
      `${baseKey}:blocked`,
      Math.max(1, ttl),
      Math.max(1, limit),
      Math.max(1, blockDuration),
    )) as number[];

    return {
      totalHits: Number(result[0]),
      timeToExpire: Number(result[1]),
      isBlocked: Number(result[2]) === 1,
      timeToBlockExpire: Number(result[3]),
    };
  }
}
