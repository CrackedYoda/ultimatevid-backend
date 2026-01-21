import { spawn } from "child_process";

const YTDLP_PATH = process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp";

export function spawnYtdlp(pageUrl: string) {
  return spawn(
    YTDLP_PATH,
    [
      "-f",
      "bv*+ba/b[ext=mp4]",
      "--merge-output-format",
      "mp4",
      "--downloader",
      "ffmpeg",
      "--downloader-args",
      "ffmpeg:-movflags frag_keyframe+empty_moov",
      "--no-playlist",
    "-o", "-", // 👈 WRITE TO STDOUT (NO FILE PATH)
      pageUrl,
    ],
    {
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
}
