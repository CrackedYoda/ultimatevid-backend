import { Worker } from "bullmq";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { bullRedis } from "../lib/bullredis";
import { detectPlatform } from "../helper/checkVid";
import { spawnYtdlp } from "../helper/ytdlp";
import { spawnYtdlp2 } from "../helper/ytdlp2";
import { getTitle } from "../services/vidService"

const OUTPUT_DIR = path.join(process.cwd(), "videos");
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

function sanitizeFilename(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^a-zA-Z0-9 ]/g, "") // Remove everything except alphanumeric and spaces
    .slice(0, 120);
}

function wait(proc: ReturnType<typeof spawn>): Promise<void> { // we use this to wait for ffmpeg/ytdlp to finish
  return new Promise((resolve, reject) => {
    proc.on("close", code => {
      code === 0 ? resolve() : reject(new Error("Process failed"));
    });
  });
}

new Worker(
  "downloadQueue",
  async job => {

    console.log(`[JOB ${job.id}] starting and ${JSON.stringify(job.data)}`);

    const { url } = job.data;
    if (!url || typeof url !== "string") {
      throw new Error("Invalid URL");
    }

    const videoName = (await getTitle(url)) || "video";
    const safeName = sanitizeFilename(`${videoName}`);
    const outputPath = path.join(OUTPUT_DIR, `${safeName}.mp4`);
    const tempPath = `${outputPath}.tmp`;

    console.log(`[JOB ${job.id}] processing`);

    // --- RETRY LOGIC (Cookies) ---
    async function processDownload(useCookies: boolean) {
      console.log(`[JOB ${job.id}] attempting download with cookies=${useCookies}`);

      const ytdlp =
        detectPlatform(url) === "tiktok"
          ? spawnYtdlp(url, useCookies)
          : spawnYtdlp2(url, useCookies);

      try {
        const ffmpegRemux = spawn("ffmpeg", [
          "-y",
          "-i", "pipe:0",
          "-c", "copy",
          "-movflags", "+faststart",
          "-f", "mp4",
          tempPath,
        ]);

        // @ts-ignore
        ytdlp.stdout.pipe(ffmpegRemux.stdin);

        // @ts-ignore
        ytdlp.stderr.on("data", (d: any) =>
          console.error(`[yt-dlp ${job.id}]`, d.toString())
        );
        // @ts-ignore
        ffmpegRemux.stderr.on("data", (d: any) =>
          console.error(`[ffmpeg-remux ${job.id}]`, d.toString())
        );

        // Wait for BOTH processes to ensure catch block triggers on yt-dlp failure too
        await Promise.all([wait(ytdlp), wait(ffmpegRemux)]);

        fs.renameSync(tempPath, outputPath);
        console.log(`[JOB ${job.id}] remuxed (cookies=${useCookies})`);

        return {
          fileName: path.basename(outputPath),
          mode: "remux",
        };
      } catch (err) {
        console.warn(`[JOB ${job.id}] remux failed (cookies=${useCookies})`);

        // If this was the second attempt (auth failure) or some unrecoverable codec error, we might try re-encoding
        // BUT current logic suggests we should retry with cookies IF specific yt-dlp failure.
        // For simplicity, we just throw here to let the outer loop handle retry or final failure.
        throw err;
      }
    }

    try {
      // First attempt: NO cookies
      return await processDownload(false);
    } catch (e) {
      console.warn(`[JOB ${job.id}] First attempt failed, retrying with cookies...`);
      try {
        // Second attempt: WITH cookies
        return await processDownload(true);
      } catch (finalErr) {
        // Fallback to Re-encoding (last resort) if it's a codec issue, 
        // OR just fail if it's a download issue.
        // Keeping original re-encode logic as a final "Hail Mary" would be complex to nest.
        // Let's assume if both fail, we might want to try the re-encode path 
        // OR just fail. Given the prompts, the main issue is AUTH.
        // I'll add a simplified re-encode fallback here for the FINAL attempt.

        console.warn(`[JOB ${job.id}] Second attempt failed, trying re-encode fallback with cookies`);

        // ... (Original re-encode logic but using cookies=true)
        const ytdlp =
          detectPlatform(url) === "tiktok"
            ? spawnYtdlp(url, true)
            : spawnYtdlp2(url, true);

        const ffmpegEncode = spawn("ffmpeg", [
          "-y",
          "-i", "pipe:0",
          "-c:v", "libx264",
          "-profile:v", "baseline",
          "-level", "3.0",
          "-pix_fmt", "yuv420p",
          "-c:a", "aac",
          "-b:a", "128k",
          "-movflags", "+faststart",
          outputPath,
        ]);

        // @ts-ignore
        ytdlp.stdout.pipe(ffmpegEncode.stdin);

        await Promise.all([wait(ytdlp), wait(ffmpegEncode)]);

        return {
          fileName: path.basename(outputPath),
          mode: "encode",
        };
      }
    }


  },
  {
    connection: bullRedis,
    concurrency: 2, // tune based on CPU
  }
);
