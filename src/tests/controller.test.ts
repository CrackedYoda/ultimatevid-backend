
import { Request, Response } from 'express';
import videoController from '../controller/vidHandler';
import videoService from '../services/vidService';
import videoDownloader from '../services/puppeteer';

// Mock dependencies
// Mock dependencies with factories to avoid loading actual files (which might have ESM issues like node-fetch)
jest.mock('../services/vidService', () => ({
    getTitle: jest.fn(),
    downloadVideo: jest.fn(),
}));

jest.mock('../services/puppeteer', () => ({
    getVideoUrl: jest.fn(),
    downloadVideoUrl: jest.fn(),
}));

describe('VideoController', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let jsonMock: jest.Mock;
    let statusMock: jest.Mock;

    beforeEach(() => {
        jsonMock = jest.fn();
        statusMock = jest.fn().mockReturnValue({ json: jsonMock });
        mockResponse = {
            status: statusMock,
            json: jsonMock,
            setHeader: jest.fn(),
            end: jest.fn(),
        };
        jest.clearAllMocks();
    });

    describe('vidCheck', () => {
        it('should return 400 if url is missing', async () => {
            mockRequest = { body: {} };
            await videoController.vidCheck(mockRequest as Request, mockResponse as Response);
            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ message: 'URL is required' }));
        });

        it('should return 400 if url is not a string', async () => {
            mockRequest = { body: { url: 123 } };
            await videoController.vidCheck(mockRequest as Request, mockResponse as Response);
            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ message: 'URL must be a string' }));
        });

        it('should return 200 and title on valid url', async () => {
            mockRequest = { body: { url: 'https://youtube.com/watch?v=123' } };
            (videoService.getTitle as jest.Mock).mockResolvedValue('Test Video Title');

            await videoController.vidCheck(mockRequest as Request, mockResponse as Response);

            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                title: 'Test Video Title'
            }));
        });
    });

    describe('vidHandler', () => {
        // Since vidHandler logic depends on global `url` variable in the controller (which is a bad practice but present in the code),
        // we need to set expectations based on the current implementation.
        // Note: The controller as written relies on `vidCheck` setting the `url` variable, or assumes `req.body.url` is irrelevant for `vidHandler` if it uses the global `url`.
        // Looking at the code: `url = req.body.url;` is in `vidCheck`. `vidHandler` uses `url` (global).
        // This makes `vidHandler` hard to test in isolation without running `vidCheck` first or refactoring.
        // I will assume for the test that we run `vidCheck` then `vidHandler` or I will acknowledge this flaw.
        // Wait, `vidHandler` reads `url` from the closure scope?
        // Line 9: `let url: string;` in controller file.
        // Lines 13-31: `vidCheck` sets `url`.
        // Lines 35-65: `vidHandler` uses `url` from line 9.
        // Ideally I should refactor this code to pass URL to `vidHandler` or extract it from request. 
        // For the test, I will try to "set" it by calling vidCheck first or just mocking the flow.

        it('should handle youtube download via videoService', async () => {
            // Setup state
            const url = 'https://www.youtube.com/watch?v=123';
            mockRequest = { body: { url } };

            // We must call vidCheck to set the internal `url` variable because of the code structure
            await videoController.vidCheck(mockRequest as Request, mockResponse as Response);

            // Now call vidHandler
            await videoController.vidHandler(mockRequest as Request, mockResponse as Response);

            expect(videoService.downloadVideo).toHaveBeenCalledWith(url, mockResponse);
        });

        // Note: Testing `socials` logic requires mocking `detectPlatform` or passing a social URL.
        // Since `detectPlatform` is imported, we might need a spy or rely on its real implementation.
        // `socials` array in `vidHandler.ts` is `[""]`?
        // Line 6: `const socials = [ ""];`
        // Line 41: `if (socials.includes(detectPlatform(url)))`
        // If `socials` is `[""]`, it will likely only match if `detectPlatform` returns `""` (which it doesn't, returns 'other' etc).
        // This looks like a bug or unfinished feature in the user's code. 
        // I will write a test for the "else" branch (service download) which seems to be the default path.
    });
});
