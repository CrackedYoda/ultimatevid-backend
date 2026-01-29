import { Worker } from "bullmq";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { bullRedis } from "../lib/bullredis";
import { detectPlatform } from "../helper/checkVid";
import { spawnYtdlp } from "../helper/ytdlp";
import { spawnYtdlp2 } from "../helper/ytdlp2";
import {getTitle} from "../services/vidService"

const OUTPUT_DIR = path.join(process.cwd(), "videos");
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

function sanitizeFilename(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\uFFFD]/g, "")
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\s+/g, " ")
    .trim()
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

    console.log(`[JOB ${job.id}] starting and ${job.data}`);

    const { url } = job.data;
    if (!url || typeof url !== "string") {
      throw new Error("Invalid URL");
    }

    const videoName = await getTitle(url);
    const safeName = sanitizeFilename(`${videoName}`);
    const outputPath = path.join(OUTPUT_DIR, `${safeName}.mp4`);
    const tempPath = `${outputPath}.tmp`;

    console.log(`[JOB ${job.id}] processing`);

    const ytdlp =
      detectPlatform(url) === "tiktok" // cause tiktok videos are weird and behave different with ytdlp tch
        ? spawnYtdlp(url)
        : spawnYtdlp2(url);

    try {
      const ffmpegRemux = spawn("ffmpeg", [   // we try remux first (fastest)
        "-y",
        "-i", "pipe:0",
        "-c", "copy",
        "-movflags", "+faststart",
        "-f", "mp4",
        tempPath,
      ]);

      ytdlp.stdout.pipe(ffmpegRemux.stdin);

      ytdlp.stderr.on("data", d =>
        console.error(`[yt-dlp ${job.id}]`, d.toString())
      );
      ffmpegRemux.stderr.on("data", d =>
        console.error(`[ffmpeg-remux ${job.id}]`, d.toString())
      );

      await wait(ffmpegRemux);

      fs.renameSync(tempPath, outputPath);
      console.log(`[JOB ${job.id}] remuxed`);

      return {
        fileName: path.basename(outputPath),
        mode: "remux",
      };
    } catch {
      console.warn(`[JOB ${job.id}] remux failed, re-encoding`);
    }

    // ─────────────────────────────────────
    // 2️⃣ FALLBACK: RE-ENCODE (SAFE PATH)
    // ─────────────────────────────────────
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

    ytdlp.stdout.pipe(ffmpegEncode.stdin);

    ytdlp.stderr.on("data", d =>
      console.error(`[yt-dlp ${job.id}]`, d.toString())
    );
    ffmpegEncode.stderr.on("data", d =>
      console.error(`[ffmpeg-encode ${job.id}]`, d.toString())
    );

    await wait(ffmpegEncode);

    console.log(`[JOB ${job.id}] encoded`);

    return {
      fileName: path.basename(outputPath),
      mode: "encode",
    };
  },
  {
    connection: bullRedis,
    concurrency: 2, // tune based on CPU
  }
);
