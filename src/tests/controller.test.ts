import { Request, Response } from 'express';
import videoController from '../controller/vidHandler';
import { downloadQueue } from '../queue/downloadqeue';

// Mock dependencies
jest.mock('../lib/bullredis', () => ({
    bullRedis: {},
}));

jest.mock('../queue/downloadqeue', () => ({
    downloadQueue: {
        add: jest.fn(),
    },
}));

jest.mock('../services/puppeteer', () => ({
    getVideoUrl: jest.fn(),
    downloadVideoUrl: jest.fn()
}));

// We need to mock bullmq because vidHandler instantiates QueueEvents
jest.mock('bullmq', () => {
    return {
        Queue: jest.fn(),
        QueueEvents: jest.fn().mockImplementation(() => ({})),
        Worker: jest.fn(),
    };
});

describe('Video Controller', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockJob: any;

    beforeEach(() => {
        mockRequest = {
            query: {},
            body: {}
        };
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            send: jest.fn()
        };

        mockJob = {
            id: '123',
            waitUntilFinished: jest.fn()
        };

        (downloadQueue.add as jest.Mock).mockResolvedValue(mockJob);
        jest.clearAllMocks();
    });

    describe('vidHandler', () => {
        it('should add job to queue and return result when successful', async () => {
            mockRequest.query = { url: 'https://example.com/video' };

            // Mock the worker result
            const workerResult = { fileName: 'video.mp4', mode: 'remux' };
            mockJob.waitUntilFinished.mockResolvedValue(workerResult);

            await videoController.vidHandler(mockRequest as Request, mockResponse as Response);

            expect(downloadQueue.add).toHaveBeenCalledWith("download", { url: 'https://example.com/video' });
            expect(mockJob.waitUntilFinished).toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                fileName: 'video.mp4',
                mode: 'remux'
            });
        });

        it('should handle errors', async () => {
            mockRequest.query = { url: 'https://example.com/video' };

            const error = new Error('Download failed');
            (downloadQueue.add as jest.Mock).mockRejectedValue(error);

            await videoController.vidHandler(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
        });
    });

    describe('vidCheck', () => {
        it('should validate URL requirement', async () => {
            mockRequest.body = {}; // No url

            await videoController.vidCheck(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                message: "URL is required"
            }));
        });
    });
});
