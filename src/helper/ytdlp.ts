import { spawn } from "child_process";

const YTDLP_PATH = process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp";

export function spawnYtdlp(pageUrl: string, useCookies: boolean = false) {
  const args = [
    "-S",
    "vcodec:h264,res,acodec:aac",
    "--merge-output-format",
    "mp4",
    "--downloader",
    "ffmpeg",
    "--downloader-args",
    "ffmpeg:-movflags frag_keyframe+empty_moov",
    "--user-agent",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "--js-runtimes",
    "node",
    "--remote-components",
    "ejs:github",
    "--no-playlist",
  ];

  if (useCookies) {
    args.push("--cookies", "/app/cookies.txt");
  }

  args.push("-o", "-", pageUrl);

  return spawn(YTDLP_PATH, args, {
    stdio: ["ignore", "pipe", "pipe"],
  });
}
