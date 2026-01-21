import { Response } from "express";
import { spawnYtdlp } from "../helper/ytdlp";
import { spawnYtdlp2 } from "../helper/ytdlp2";
import { detectPlatform } from "../helper/checkVid";
import { spawn } from "child_process";

const YTDLP_PATH = process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp";

class videoService {
  
async downloadVideo(url: string, res: Response)  {
  const pageUrl = url;

  if (!pageUrl || typeof pageUrl !== "string") {
    return res.status(400).json({
      field: "url",
      message: "A valid page URL is required",
    });
  }
   const title = await this.getTitle(pageUrl) || "video";
  
  res.setHeader("Content-Disposition", `attachment; filename="${title}.mp4"`);
  res.setHeader("Content-Type", "video/mp4");

  const attemptDownload = (retries: number) => {
    let ytdlp;
    if (detectPlatform(pageUrl) === "tiktok") {
      ytdlp = spawnYtdlp(pageUrl);
    } else {
      ytdlp = spawnYtdlp2(pageUrl);
    }

    const onError = (error?: any) => {
      console.error("yt-dlp error:", error || "Process exited with non-zero code");
      ytdlp.stdout.unpipe(res);
      if (retries > 0) {
        console.log(`Retrying... (${retries} attempts left)`);
        attemptDownload(retries - 1);
      } else {
        if (!res.headersSent) {
          res.status(500).json({ success: false, message: "Failed to download video after multiple attempts." });
        } else {
          res.end(); // End the stream if headers are already sent
        }
      }
    };

    ytdlp.stderr.on("data", (d) => {
      console.error("yt-dlp stderr:", d.toString());
    });

    ytdlp.on("error", onError);

    ytdlp.on("close", (code) => {
      if (code === 0) {
        console.log("yt-dlp exited successfully.");
        res.end();
      } else {
        onError(`yt-dlp exited with code ${code}`);
      }
    });

    ytdlp.stdout.pipe(res, { end: false });
  };

  attemptDownload(1); // Initial attempt + 1 retry
};

async getTitle(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    const ytdlp = spawn(YTDLP_PATH, [
      "--no-playlist",
      "--print", "title",
      url,
    ]);

    let title = "";
    let error = "";

    ytdlp.stdout.on("data", (data) => {
      title += data.toString();
    });

    ytdlp.stderr.on("data", (data) => {
      error += data.toString();
    });

    ytdlp.on("error", (err) => {
      console.error("Failed to start yt-dlp process.", err);
      resolve(null);
    });

    ytdlp.on("close", (code) => {
      if (code === 0) {
        resolve(title.trim());
      } else {
        console.error(`yt-dlp exited with code ${code}. Stderr: ${error}`);
        resolve(null);
      }
    });
  });
}

}
 

export default new videoService;