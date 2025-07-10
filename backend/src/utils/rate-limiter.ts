interface RateLimitEntry {
  count: number;
  windowStart: number;
}

interface RateLimitStore {
  minute: Map<string, RateLimitEntry>;
  hour: Map<string, RateLimitEntry>;
}

class RateLimiter {
  private store: RateLimitStore = {
    minute: new Map(),
    hour: new Map()
  };

  private readonly MINUTE_LIMIT = process.env.RATE_LIMIT_MAX_REQUESTS_PER_MINUTE 
    ? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS_PER_MINUTE) 
    : 20;
  private readonly HOUR_LIMIT = process.env.RATE_LIMIT_MAX_REQUESTS_PER_HOUR 
    ? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS_PER_HOUR) 
    : 300;

  private cleanupOldEntries(): void {
    const now = Date.now();
    const minuteThreshold = now - 60 * 1000;
    const hourThreshold = now - 60 * 60 * 1000;

    for (const [key, entry] of this.store.minute.entries()) {
      if (entry.windowStart < minuteThreshold) {
        this.store.minute.delete(key);
      }
    }

    for (const [key, entry] of this.store.hour.entries()) {
      if (entry.windowStart < hourThreshold) {
        this.store.hour.delete(key);
      }
    }
  }

  public checkLimit(identifier: string = 'default'): {
    allowed: boolean;
    minuteRemaining: number;
    hourRemaining: number;
    resetTime: number;
  } {
    this.cleanupOldEntries();
    
    const now = Date.now();
    const minuteKey = `${identifier}:${Math.floor(now / 60000)}`;
    const hourKey = `${identifier}:${Math.floor(now / 3600000)}`;

    // Check minute limit
    const minuteEntry = this.store.minute.get(minuteKey) || { count: 0, windowStart: now };
    const hourEntry = this.store.hour.get(hourKey) || { count: 0, windowStart: now };

    const minuteRemaining = Math.max(0, this.MINUTE_LIMIT - minuteEntry.count);
    const hourRemaining = Math.max(0, this.HOUR_LIMIT - hourEntry.count);

    const allowed = minuteEntry.count < this.MINUTE_LIMIT && hourEntry.count < this.HOUR_LIMIT;

    if (allowed) {
      // Increment counters
      this.store.minute.set(minuteKey, {
        count: minuteEntry.count + 1,
        windowStart: minuteEntry.windowStart
      });
      this.store.hour.set(hourKey, {
        count: hourEntry.count + 1,
        windowStart: hourEntry.windowStart
      });
    }

    return {
      allowed,
      minuteRemaining: allowed ? minuteRemaining - 1 : minuteRemaining,
      hourRemaining: allowed ? hourRemaining - 1 : hourRemaining,
      resetTime: Math.max(
        Math.ceil(now / 60000) * 60000, 
        Math.ceil(now / 3600000) * 3600000
      )
    };
  }
}

export const rateLimiter = new RateLimiter(); 