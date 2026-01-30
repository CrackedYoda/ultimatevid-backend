import { spawn } from "child_process";

const YTDLP_PATH = process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp";

export function spawnYtdlp(pageUrl: string) {
  return spawn(
    YTDLP_PATH,
    [
      "-f",
      "bv*[vcodec^=avc1]+ba[acodec^=mp4a]/b[ext=mp4]/b",
      "--merge-output-format",
      "mp4",
      "--downloader",
      "ffmpeg",
      "--downloader-args",
      "ffmpeg:-movflags frag_keyframe+empty_moov",
      "--user-agent",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      "--no-playlist",
      "-o", "-", // 👈 WRITE TO STDOUT (NO FILE PATH)
      pageUrl,
    ],
    {
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
}
