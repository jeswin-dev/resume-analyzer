import { describe, it, expect, beforeEach, vi } from 'vitest';
import { rateLimiter } from '../utils/rate-limiter';

describe('RateLimiter', () => {
  beforeEach(() => {
    // Reset the rate limiter state
    (rateLimiter as any).store.minute.clear();
    (rateLimiter as any).store.hour.clear();
    vi.clearAllMocks();
  });

  it('should allow requests within limits', () => {
    const result = rateLimiter.checkLimit('test-client');
    
    expect(result.allowed).toBe(true);
    expect(result.minuteRemaining).toBe(19); // 20 - 1
    expect(result.hourRemaining).toBe(299); // 300 - 1
  });

  it('should deny requests when minute limit is exceeded', () => {
    // Make 20 requests (the limit)
    for (let i = 0; i < 20; i++) {
      rateLimiter.checkLimit('test-client');
    }

    // The 21st request should be denied
    const result = rateLimiter.checkLimit('test-client');
    expect(result.allowed).toBe(false);
    expect(result.minuteRemaining).toBe(0);
  });

  it('should handle different clients separately', () => {
    // Client 1 makes requests
    for (let i = 0; i < 19; i++) {
      rateLimiter.checkLimit('client-1');
    }

    // Client 2 should still be allowed
    const result = rateLimiter.checkLimit('client-2');
    expect(result.allowed).toBe(true);
    expect(result.minuteRemaining).toBe(19);
  });

  it('should use default client when no identifier provided', () => {
    const result1 = rateLimiter.checkLimit();
    const result2 = rateLimiter.checkLimit();
    
    expect(result1.allowed).toBe(true);
    expect(result2.allowed).toBe(true);
    expect(result2.minuteRemaining).toBe(18); // 20 - 2
  });
}); 