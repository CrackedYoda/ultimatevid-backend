
import { Request, Response, NextFunction } from 'express';
import { rateLimit } from '../middleware/rateLimit';
import * as RedisLib from '../lib/redis';

// Mock getRedis
jest.mock('../lib/redis');

describe('Rate Limit Middleware', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockNext: NextFunction;
    let mockRedisClient: any;

    beforeEach(() => {
        mockRequest = {
            ip: '127.0.0.1'
        };
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        mockNext = jest.fn();

        mockRedisClient = {
            incr: jest.fn(),
            expire: jest.fn(),
            isOpen: true
        };

        (RedisLib.getRedis as jest.Mock).mockResolvedValue(mockRedisClient);
        jest.clearAllMocks();
    });

    it('should allow request if under limit', async () => {
        mockRedisClient.incr.mockResolvedValue(1);

        await rateLimit(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockRedisClient.incr).toHaveBeenCalledWith('rate-limit:127.0.0.1');
        expect(mockRedisClient.expire).toHaveBeenCalledWith('rate-limit:127.0.0.1', 60);
        expect(mockNext).toHaveBeenCalled();
        expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should block request if over limit', async () => {
        mockRedisClient.incr.mockResolvedValue(6);

        await rateLimit(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockRedisClient.incr).toHaveBeenCalledWith('rate-limit:127.0.0.1');
        expect(mockResponse.status).toHaveBeenCalledWith(429);
        expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
            message: "Too many requests, try again later."
        }));
        expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle redis errors gracefully (optional, depends on implementation)', async () => {
        // Current implementation does not try-catch redis errors, so express error handler would catch it.
        // We can test if it throws.
        const error = new Error('Redis connection lost');
        mockRedisClient.incr.mockRejectedValue(error);

        await expect(rateLimit(mockRequest as Request, mockResponse as Response, mockNext))
            .rejects.toThrow('Redis connection lost');
    });
});
