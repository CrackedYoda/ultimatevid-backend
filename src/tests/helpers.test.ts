
import { detectPlatform } from "../helper/checkVid";
import { isM3U8 } from "../helper/detectFormat";

describe("Helper Functions", () => {
    describe("detectPlatform", () => {
        test("should detect facebook URLs", () => {
            expect(detectPlatform("https://www.facebook.com/watch?v=123")).toBe("facebook");
            expect(detectPlatform("https://fb.watch/123")).toBe("facebook");
        });

        test("should detect instagram URLs", () => {
            expect(detectPlatform("https://www.instagram.com/p/123")).toBe("instagram");
        });

        test("should detect tiktok URLs", () => {
            expect(detectPlatform("https://www.tiktok.com/@user/video/123")).toBe("tiktok");
            expect(detectPlatform("https://vm.tiktok.com/123")).toBe("tiktok");
        });

        test("should detect youtube URLs", () => {
            expect(detectPlatform("https://www.youtube.com/watch?v=123")).toBe("youtube");
            expect(detectPlatform("https://youtu.be/123")).toBe("youtube");
        });

        test("should detect twitter URLs", () => {
            expect(detectPlatform("https://twitter.com/user/status/123")).toBe("twitter");
            expect(detectPlatform("https://x.com/user/status/123")).toBe("twitter");
        });

        test("should detect reddit URLs", () => {
            expect(detectPlatform("https://www.reddit.com/r/funny/comments/123/video/")).toBe("reddit");
        });

        test("should return 'other' for unknown platforms", () => {
            expect(detectPlatform("https://example.com")).toBe("other");
        });
    });

    describe("isM3U8", () => {
        test("should return true for .m3u8 urls", () => {
            expect(isM3U8("https://example.com/video.m3u8")).toBe(true);
            expect(isM3U8("https://example.com/video.M3U8")).toBe(true);
        });

        test("should return false for other urls", () => {
            expect(isM3U8("https://example.com/video.mp4")).toBe(false);
        });
    });
});
