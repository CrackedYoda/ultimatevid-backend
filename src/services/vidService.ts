import { Response } from "express";
import { spawn } from "child_process";
import { detectPlatform } from "../helper/checkVid";
import { spawnYtdlp } from "../helper/ytdlp";
import { spawnYtdlp2 } from "../helper/ytdlp2";

const YTDLP_PATH = process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp";

/**
 * FINAL, BULLETPROOF filename sanitizer
 * - removes unicode
 * - removes replacement char �
 * - strips illegal header chars
 */
function sanitizeFilename(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\uFFFD]/g, "")              // remove �
    .replace(/[\r\n]+/g, " ")              // newlines
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "") // illegal chars
    .replace(/[^\x20-\x7E]/g, "")          // non-ASCII
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 150);
}

class VideoService {
  async downloadVideo(pageUrl: string, res: Response) {
    if (!pageUrl || typeof pageUrl !== "string") {
      return res.status(400).json({
        field: "url",
        message: "A valid page URL is required",
      });
    }

    // 1️⃣ Get & sanitize title
    const rawTitle = (await this.getTitle(pageUrl)) || "video";
    const safeTitle = sanitizeFilename(rawTitle) || "video";
    const encodedTitle = encodeURIComponent(safeTitle);

    console.log("RAW TITLE:", JSON.stringify(rawTitle));
    console.log("SAFE TITLE:", JSON.stringify(safeTitle));

    // 2️⃣ RFC-correct headers (CRITICAL)
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${safeTitle}.mp4"; filename*=UTF-8''${encodedTitle}.mp4`
    );
    res.setHeader("Content-Type", "video/mp4");

    // 3️⃣ Download attempt with retry
    const attemptDownload = (retries: number) => {
      const ytdlp =
        detectPlatform(pageUrl) === "tiktok"
          ? spawnYtdlp(pageUrl)
          : spawnYtdlp2(pageUrl);

      const handleFailure = (reason?: any) => {
        console.error("yt-dlp failed:", reason);
        ytdlp.stdout?.unpipe(res);

        if (retries > 0) {
          console.log(`Retrying yt-dlp (${retries} left)`);
          attemptDownload(retries - 1);
        } else {
          if (!res.headersSent) {
            res.status(500).json({
              success: false,
              message: "Failed to download video",
            });
          } else {
            res.end();
          }
        }
      };

      ytdlp.stderr.on("data", d =>
        console.error("yt-dlp stderr:", d.toString())
      );

      ytdlp.on("error", handleFailure);

      ytdlp.on("close", code => {
        if (code === 0) {
          res.end();
        } else {
          handleFailure(`exit code ${code}`);
        }
      });

      ytdlp.stdout.pipe(res, { end: false });
    };

    attemptDownload(1);
  }

  /**
   * Fetch video title safely using yt-dlp
   */
  async getTitle(url: string): Promise<string | null> {
    return new Promise(resolve => {
      const proc = spawn(YTDLP_PATH, [
        "--no-playlist",
        "--print",
        "title",
        url,
      ]);

      let title = "";
      let error = "";

      proc.stdout.on("data", d => (title += d.toString()));
      proc.stderr.on("data", d => (error += d.toString()));

      proc.on("error", err => {
        console.error("yt-dlp spawn failed:", err);
        resolve(null);
      });

      proc.on("close", code => {
        if (code === 0) {
          resolve(title.trim());
        } else {
          console.error("yt-dlp title error:", error);
          resolve(null);
        }
      });
    });
  }
}

export default new VideoService();
