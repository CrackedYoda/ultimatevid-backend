import { spawn } from "child_process";
import fetch from "node-fetch";
import { pipeline } from "stream";
import { promisify } from "util";

const streamPipeline = promisify(pipeline);

interface MediaFormat {
  id: string;
  quality?: string;
  ext: string;
  url: string;
  hasAudio: boolean;
  hasVideo: boolean;
  size?: number;
}

interface ExtractedInfo {
  id: string;
  title: string;
  uploader?: string;
  formats: MediaFormat[];
}

/**
 * Extract metadata from any URL using yt-dlp
 */
export async function extractYtDlp(url: string): Promise<ExtractedInfo> {
  if (!url || typeof url !== "string") {
    throw new Error("Invalid URL");
  }

  return new Promise((resolve, reject) => {
    const p = spawn("C:\\Users\\HP\\yt-dlp\\yt-dlp.exe", ["-J", "--no-playlist", url]);

    let out = "";
    let err = "";

    // Collect standard output (JSON)
    p.stdout.on("data", d => (out += d));

    // Collect standard error (warnings or errors)
    p.stderr.on("data", e => (err += e));

    // Handle process exit
    p.on("close", code => {
      if (code !== 0) {
        return reject(new Error(err || "yt-dlp process failed"));
      }

      try {
        const info = JSON.parse(out);

        const formats: MediaFormat[] = info.formats
          .filter((f: any) => f.height && f.height >= 144)
          .filter((f: any) => f.vcodec !== "none" && f.acodec !== "none")
          // .filter((f: any) => f.format_id.endsWith("-1"))
          .map((f: any) => ({
            id: f.format_id,
            quality: f.height ? `${f.height}p` : f.format_note,
            ext: f.ext,
            url: f.url,
            hasAudio: f.acodec !== "none",
            hasVideo: f.vcodec !== "none",
            size: f.filesize || f.filesize_approx,
          }));

        resolve({
          id: info.id,
          title: info.title,
          uploader: info.uploader,
          formats,
        });
      } catch (parseErr) {
        reject(new Error("Failed to parse yt-dlp output: " + parseErr));
      }
    });

    // Optional: handle spawn errors
    p.on("error", spawnErr => reject(new Error("Failed to start yt-dlp: " + spawnErr)));
  });
}

/**
 * Stream a selected video format to the client safely
 */
export async function streamVideo(mediaUrl: string, res: any) {
  if (!mediaUrl || !mediaUrl.startsWith("http")) {
    res.status(400).send("Invalid media URL");
    return;
  }

  try {
    const response = await fetch(mediaUrl, {
      headers: { "User-Agent": "Ultimatevid/1.0" },
    });

    if (!response.ok || !response.body) {
      res.status(502).send("Failed to fetch media");
      return;
    }

    // Forward content-type and length
    const contentType = response.headers.get("content-type");
    const contentLength = response.headers.get("content-length");
    if (contentType) res.setHeader("Content-Type", contentType);
    if (contentLength) res.setHeader("Content-Length", contentLength);

    // Force download
    res.setHeader("Content-Disposition", 'attachment; filename="video.mp4"');

    // Stream safely with backpressure handling
    await streamPipeline(response.body as any, res);
  } catch (err) {
    console.error("Streaming error:", err);
    if (!res.headersSent) {
      res.status(500).send("Streaming failed");
    }
  }
}
